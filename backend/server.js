import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import { createClient } from "redis";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

// --- Cloudinary (persistent image storage — Render's disk is ephemeral) ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- Connect to MongoDB (fail fast — no point serving without a database) ---
try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB connected");
} catch (err) {
  console.error("❌ MongoDB connection failed, exiting:", err.message);
  process.exit(1);
}

const redis = createClient({ url: process.env.REDIS_URL });

redis.on("error", (err) => {
  console.log("❌ Redis connection error:", err);
});

try {

  await redis.connect();

  console.log("✅ Redis connected");

} catch (err) {

  console.log("❌ Redis connection failed:", err);

}

// Explicit origin list — "*" is rejected by browsers when credentials are used
const allowedOrigins = (
  process.env.FRONTEND_ORIGINS ||
  "http://localhost:3000, https://blop-post-with-better-auth-fixed-on.vercel.app, https://blogcraft-with-betterauth.vercel.app/"
).split(",");

const corsOptions = {
  origin: allowedOrigins,
  credentials: true, // Allow credentials (cookies) to be sent
};

const app = express();

// Render/Vercel run behind a reverse proxy — trust the first hop so
// rate limiting sees the real client IP, not the proxy's
app.set("trust proxy", 1);

// Security headers (crossOriginResourcePolicy relaxed so the frontend
// on another domain can load images from /uploads)
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// --- Rate limiting ---
// General: 300 requests / 15 min per IP (reads are cheap thanks to Redis)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "❌ Too many requests, please try again later" },
});

// Strict: 30 requests / 15 min per IP for writes and uploads
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "❌ Too many write requests, please slow down" },
});

app.use(generalLimiter);
app.use(cors(corsOptions));
app.use(express.json({ limit: "100kb" })); // posts are text — 100kb is plenty

// --- Configure multer: keep files in memory, then stream to Cloudinary ---
// Only accept images, max 5MB
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only image files are allowed"));
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Upload an in-memory file buffer to Cloudinary, returns the secure URL
const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `bloppost/${folder}`,
        resource_type: "image",
        // auto-optimize: serve modern formats and reasonable quality
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => (error ? reject(error) : resolve(result.secure_url))
    );
    stream.end(buffer);
  });

// --- Post Schema ---
const postSchema = new mongoose.Schema({
  image: String,
  category: String,
  title: String,
  description: String,
  authorId: String, // Better Auth user id of the creator
  author: { name: String, img: String },
  date: String,
  like: { count: Number, isliked: Boolean },
  likedBy: { type: [String], default: [] }, // user ids who liked this post
  readTime: String,
});
const Post = mongoose.model("Post", postSchema);

// --- Comment Schema ---
const commentSchema = new mongoose.Schema({
  postId: { type: String, required: true, index: true },
  authorId: { type: String, required: true }, // Better Auth user id
  author: { name: String, img: String },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const Comment = mongoose.model("Comment", commentSchema);

// --- Auth middleware: validate Better Auth session token ---
// The frontend sends the Better Auth session token as a Bearer header.
// Sessions live in the same MongoDB database (collection: "session"),
// so we validate the token directly against it.
const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "❌ Not authenticated" });
    }

    const session = await mongoose.connection.db
      .collection("session")
      .findOne({ token });

    if (!session || new Date(session.expiresAt) < new Date()) {
      return res.status(401).json({ message: "❌ Session expired or invalid" });
    }

    req.userId = String(session.userId);
    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    res.status(500).json({ message: "❌ Error verifying session" });
  }
};

// Like requireAuth, but doesn't reject — just resolves the user id if a
// valid token is present. Used on public GET routes to compute `isliked`.
const getUserIdFromToken = async (req) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return null;

    const session = await mongoose.connection.db
      .collection("session")
      .findOne({ token });

    if (!session || new Date(session.expiresAt) < new Date()) return null;
    return String(session.userId);
  } catch {
    return null;
  }
};

// Compute per-user `isliked` from likedBy and hide the raw likedBy list
const shapePost = (post, userId) => {
  const p = post.toObject ? post.toObject() : post;
  const likedBy = p.likedBy || [];
  return {
    ...p,
    like: {
      count: likedBy.length,
      isliked: userId ? likedBy.includes(userId) : false,
    },
    likedBy: undefined,
  };
};

// Invalidate every cached page of the post list (keys look like posts:1:50)
const clearPostsCache = async () => {
  try {
    const keys = [];
    for await (const batch of redis.scanIterator({ MATCH: "posts:*", COUNT: 100 })) {
      // node-redis v5 yields arrays of keys
      keys.push(...(Array.isArray(batch) ? batch : [batch]));
    }
    if (keys.length) await redis.del(keys);
  } catch (err) {
    console.log("❌ Redis cache invalidation failed:", err);
  }
};

// --- Upload User Image ---
app.post("/upload/user", writeLimiter, requireAuth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No image file uploaded" });

    const url = await uploadToCloudinary(req.file.buffer, "user");
    res.status(200).json({ message: "✅ User image uploaded", url });
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);
    res.status(500).json({ message: "❌ Error uploading image" });
  }
});

// --- Upload Post Image ---
app.post("/upload/post", writeLimiter, requireAuth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No image file uploaded" });

    const url = await uploadToCloudinary(req.file.buffer, "post");
    res.status(200).json({ message: "✅ Post image uploaded", url });
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);
    res.status(500).json({ message: "❌ Error uploading image" });
  }
});



// --- Post input validation ---
const CATEGORIES = ["Technology", "Design", "JavaScript", "Leadership", "Cloud", "UI/UX"];
const MAX_POSTS_PER_REQUEST = 10;

// returns an error string, or null if the post is valid
const validatePostInput = (post) => {
  if (!post || typeof post !== "object") return "Each post must be an object";

  if (typeof post.title !== "string" || !post.title.trim())
    return "Title is required";
  if (post.title.length > 100) return "Title must be 100 characters or less";

  if (typeof post.description !== "string" || !post.description.trim())
    return "Description is required";
  if (post.description.length > 400)
    return "Description must be 400 characters or less";

  if (!CATEGORIES.includes(post.category))
    return `Category must be one of: ${CATEGORIES.join(", ")}`;

  if (post.image && (typeof post.image !== "string" || post.image.length > 2000))
    return "Image must be a URL string";

  return null;
};

// ➕ Create one or many posts
app.post("/posts", writeLimiter, requireAuth, async (req, res) => {
  try {
    let body = req.body;

    if (!Array.isArray(body)) body = [body];

    if (body.length === 0 || body.length > MAX_POSTS_PER_REQUEST) {
      return res.status(400).json({
        message: `❌ You can create between 1 and ${MAX_POSTS_PER_REQUEST} posts per request`,
      });
    }

    for (const post of body) {
      const error = validatePostInput(post);
      if (error) return res.status(400).json({ message: `❌ ${error}` });
    }

    const calculateReadTime = (text) => {
      const words = text?.split(/\s+/).length || 0;
      const minutes = Math.ceil(words / 200);
      return `${minutes} min read`;
    };

    // Author identity comes from the session, not the request body.
    const author = await getAuthorInfo(req.userId);

    const DynamicPost = body.map((post) => ({
      image: post.image || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
      category: post.category,
      title: post.title,
      description: post.description,
      authorId: req.userId,
      author,
      date: post.date || new Date().toISOString(),
      like: post.like || { count: 0, isliked: false },
      readTime: post.readTime || calculateReadTime(post.description || "temp min"),
    }));
    const posts = await Post.insertMany(DynamicPost);
    await clearPostsCache();
    res.status(201).json({message: "inserted Posts:- ", posts})
  } catch (error) {
    console.error("❌ Backend error while creating post:", error);
    res.status(500).json({ message: "❌ Error creating post(s)", error });
  }
});

// Look up a user's public identity (name + avatar) by Better Auth user id.
// The mongodb adapter stores users under _id (ObjectId), with a string-id fallback.
const getAuthorInfo = async (userId) => {
  const userColl = mongoose.connection.db.collection("user");
  let user = null;
  if (mongoose.Types.ObjectId.isValid(userId)) {
    user = await userColl.findOne({ _id: new mongoose.Types.ObjectId(userId) });
  }
  if (!user) {
    user = await userColl.findOne({ id: userId });
  }
  return {
    name: user?.name || "Unknown",
    img:
      user?.image ||
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
  };
};

// 📖 Get all posts (paginated: ?page=1&limit=50, newest first)
app.get("/posts", async (req, res) => {
  try {
    const userId = await getUserIdFromToken(req);

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;
    const cacheKey = `posts:${page}:${limit}`;

    let cached = null;

    try {
      cached = await redis.get(cacheKey);
    } catch (err) {
      console.log("❌ Redis GET failed:", err);
    }

    // Cache holds raw {posts, total}; isliked is computed per user
    if (cached) {
      console.log("✅ Posts fetched from Redis cache");
      const { posts: rawPosts, total } = JSON.parse(cached);
      res.set("X-Total-Count", String(total));
      return res.status(200).json(rawPosts.map((p) => shapePost(p, userId)));
    }

    // if it is not in redis, fetch from mongodb
    const [posts, total] = await Promise.all([
      Post.find().sort({ _id: -1 }).skip(skip).limit(limit),
      Post.countDocuments(),
    ]);

    // then we will store it in redis for next time
    try {
      await redis.set(cacheKey, JSON.stringify({ posts, total }), {
        EX: 600,
      });
    } catch (err) {
      console.log("❌ Redis cache write failed:", err);
    }

    console.log("✅ Posts fetched from MongoDB and cached in Redis");
    res.set("X-Total-Count", String(total));
    res.status(200).json(posts.map((p) => shapePost(p, userId)));
  } catch (error) {
    res.status(500).json({ message: "❌ Error fetching posts", error });
  }
});

// 📖 Get one post by ID
app.get("/posts/:id", async (req, res) => {
  try {
    const userId = await getUserIdFromToken(req);
    const key = `post:${req.params.id}`;

    const cached = await redis.get(key);

    if (cached) {
      console.log("⚡ Post from Redis");
      return res.status(200).json(shapePost(JSON.parse(cached), userId));
    }

    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    await redis.set(key, JSON.stringify(post), { EX: 600 });

    res.status(200).json(shapePost(post, userId));
  } catch (error) {
    res.status(500).json({ message: "❌ Error fetching post", error });
  }
});

// 💬 Get comments for a post (public, oldest first)
app.get("/posts/:id/comments", async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.id }).sort({
      createdAt: 1,
    });
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: "❌ Error fetching comments", error });
  }
});

// 💬 Add a comment to a post (auth required)
app.post("/posts/:id/comments", writeLimiter, requireAuth, async (req, res) => {
  try {
    const text = (req.body.text || "").trim();
    if (!text) return res.status(400).json({ message: "❌ Comment text is required" });
    if (text.length > 500)
      return res.status(400).json({ message: "❌ Comment must be 500 characters or less" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Author identity comes from the session, not the request body.
    const author = await getAuthorInfo(req.userId);

    const comment = await Comment.create({
      postId: req.params.id,
      authorId: req.userId,
      author,
      text,
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error("❌ Error creating comment:", error);
    res.status(500).json({ message: "❌ Error creating comment", error });
  }
});

// 🗑️ Delete a comment (owner only)
app.delete("/comments/:id", writeLimiter, requireAuth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.authorId !== req.userId) {
      return res.status(403).json({ message: "❌ You can only delete your own comments" });
    }

    await comment.deleteOne();
    res.status(200).json({ message: "✅ Comment deleted" });
  } catch (error) {
    res.status(500).json({ message: "❌ Error deleting comment", error });
  }
});

// ✏️ Update one post (owner only)
app.put("/posts/:id", writeLimiter, requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // legacy posts (no authorId) are left editable; owned posts are protected
    if (post.authorId && post.authorId !== req.userId) {
      return res.status(403).json({ message: "❌ You can only edit your own posts" });
    }

    // whitelist updatable fields — ownership and like data are untouchable
    const allowed = ["image", "category", "title", "description", "date", "readTime"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    // validate the merged result so partial updates can't corrupt a post
    const error = validatePostInput({ ...post.toObject(), ...updates });
    if (error) return res.status(400).json({ message: `❌ ${error}` });

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true } // return updated document
    );
    await clearPostsCache();
    await redis.del(`post:${req.params.id}`);
    res.status(200).json({ message: "✅ Post updated", post: updatedPost });
  } catch (error) {
    res.status(500).json({ message: "❌ Error updating post", error });
  }
});

// Toggle like for the authenticated user
app.patch("/posts/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const alreadyLiked = (post.likedBy || []).includes(userId);

    // add or remove this user from likedBy, keep like.count in sync
    const updated = await Post.findByIdAndUpdate(
      id,
      alreadyLiked
        ? { $pull: { likedBy: userId }, $inc: { "like.count": -1 } }
        : { $addToSet: { likedBy: userId }, $inc: { "like.count": 1 } },
      { new: true }
    );

    await clearPostsCache();
    await redis.del(`post:${id}`);
    res.json(shapePost(updated, userId));
  } catch (err) {
    console.error("❌ PATCH /posts error:", err);
    res.status(500).json({ error: "Failed to update like" });
  }
});



// 🗑️ Delete one post (owner only)
app.delete("/posts/:id", writeLimiter, requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.authorId && post.authorId !== req.userId) {
      return res.status(403).json({ message: "❌ You can only delete your own posts" });
    }

    const deletedPost = await Post.findByIdAndDelete(req.params.id);
    await clearPostsCache();
    await redis.del(`post:${req.params.id}`);
    res.status(200).json({ message: "✅ Post deleted", post: deletedPost });
  } catch (error) {
    res.status(500).json({ message: "❌ Error deleting post", error });
  }
});

// 🧹 Delete all of MY posts (scoped to the authenticated user)
app.delete("/posts", writeLimiter, requireAuth, async (req, res) => {
  try {
    const result = await Post.deleteMany({ authorId: req.userId });
    await clearPostsCache();
    res.status(200).json({
      message: `✅ Your posts were deleted successfully (${result.deletedCount} deleted)`
    });
  } catch (error) {
    res.status(500).json({ message: "❌ Error deleting posts", error });
  }
});

// ================= HEALTH CHECK =================

// Full health check
app.get("/health", async (req, res) => {

  try {

    // MongoDB ping
    await mongoose.connection.db.admin().ping();

    // Redis ping
    await redis.ping();

    res.status(200).json({
      status: "ok",
      mongo: "connected",
      redis: "connected",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {

    console.error("❌ Health check failed:", error);

    res.status(500).json({
      status: "error",
      mongo: mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",

      redis: redis.isOpen
        ? "connected"
        : "disconnected",

      error: error.message,
    });
  }
});


// HEAD version (better for uptime monitors)
app.head("/health", async (req, res) => {

  try {

    await mongoose.connection.db.admin().ping();

    await redis.ping();

    res.sendStatus(200);

  } catch (error) {

    console.error("❌ HEAD health failed:", error);

    res.sendStatus(500);
  }
});


// --- Multer / upload error handler (must come after routes) ---
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image is too large (max 5MB)"
        : err.code === "LIMIT_UNEXPECTED_FILE"
          ? "Only image files are allowed"
          : err.message;
    return res.status(400).json({ message: `❌ ${message}` });
  }
  next(err);
});

// ✅ Start the server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// --- Graceful shutdown (Render sends SIGTERM on every deploy) ---
const shutdown = async (signal) => {
  console.log(`\n${signal} received — shutting down gracefully...`);

  // stop accepting new connections, let in-flight requests finish
  server.close(async () => {
    try {
      await mongoose.connection.close();
      console.log("✅ MongoDB connection closed");
    } catch (err) {
      console.error("❌ Error closing MongoDB:", err.message);
    }

    try {
      if (redis.isOpen) await redis.quit();
      console.log("✅ Redis connection closed");
    } catch (err) {
      console.error("❌ Error closing Redis:", err.message);
    }

    process.exit(0);
  });

  // force-exit if something hangs longer than 10s
  setTimeout(() => {
    console.error("⚠️ Forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
