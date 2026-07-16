import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import { createClient } from "redis";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";

// --- Connect to MongoDB ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log(err));

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
  "http://localhost:3000,https://blop-post-with-better-auth-fixed-on.vercel.app"
).split(",");

const corsOptions = {
  origin: allowedOrigins,
  credentials: true, // Allow credentials (cookies) to be sent
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());

// --- Setup file upload folders ---
const uploadDir = path.join(process.cwd(), "uploads");
const userUploadDir = path.join(uploadDir, "user");
const postUploadDir = path.join(uploadDir, "post");

// Ensure directories exist
[uploadDir, userUploadDir, postUploadDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

// --- Configure multer (reusable) ---
const createStorage = (folderPath) =>
  multer.diskStorage({
    destination: (req, file, cb) => cb(null, folderPath),
    filename: (req, file, cb) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    },
});

// Only accept images, max 5MB
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only image files are allowed"));
  }
};

const uploadLimits = { fileSize: 5 * 1024 * 1024 }; // 5MB

const uploadUser = multer({
  storage: createStorage(userUploadDir),
  fileFilter: imageFileFilter,
  limits: uploadLimits,
});
const uploadPost = multer({
  storage: createStorage(postUploadDir),
  fileFilter: imageFileFilter,
  limits: uploadLimits,
});

// Serve uploaded files statically
app.use("/uploads", express.static(uploadDir));

// --- Post Schema ---
const postSchema = new mongoose.Schema({
  image: String,
  category: String,
  title: String,
  description: String,
  author: { name: String, img: String },
  date: String,
  like: { count: Number, isliked: Boolean },
  likedBy: { type: [String], default: [] }, // user ids who liked this post
  readTime: String,
});
const Post = mongoose.model("Post", postSchema);

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

// --- Upload User Image ---
app.post("/upload/user", requireAuth, uploadUser.single("image"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ message: "No image file uploaded" });

  const url = `${process.env.BASE_URL}/uploads/user/${req.file.filename}`;
  res.status(200).json({ message: "✅ User image uploaded", url });
});

// --- Upload Post Image ---
app.post("/upload/post", requireAuth, uploadPost.single("image"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ message: "No image file uploaded" });

  const url = `${process.env.BASE_URL}/uploads/post/${req.file.filename}`;
  res.status(200).json({ message: "✅ Post image uploaded", url });
});



// ➕ Create one or many posts
app.post("/posts", requireAuth, async (req, res) => {
  try {
    let body = req.body;

    if (!Array.isArray(body)) body = [body];

    const calculateReadTime = (text) => {
      const words = text?.split(/\s+/).length || 0;
      const minutes = Math.ceil(words / 200);
      return `${minutes} min read`;
    };

    const DynamicPost = body.map((post) => ({
      image: post.image || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
      category: post.category,
      title: post.title,
      description: post.description,
      author: post.author,
      date: post.date || new Date().toISOString(),
      like: post.like || { count: 0, isliked: false },
      readTime: post.readTime || calculateReadTime(post.description || "temp min"),
    }));
    const posts = await Post.insertMany(DynamicPost);
    await redis.del("posts");
    res.status(201).json({message: "inserted Posts:- ", posts})
  } catch (error) {
    console.error("❌ Backend error while creating post:", error);
    res.status(500).json({ message: "❌ Error creating post(s)", error });
  }
});

// 📖 Get all posts
app.get("/posts", async (req, res) => {
  try {
    const userId = await getUserIdFromToken(req);

    let cached = null;

    try {

      cached = await redis.get("posts");

    } catch (err) {

      console.log("❌ Redis GET failed:", err);

    }

    // Cache holds raw posts (with likedBy); isliked is computed per user
    if (cached) {
      console.log("✅ Posts fetched from Redis cache");
      const rawPosts = JSON.parse(cached);
      return res.status(200).json(rawPosts.map((p) => shapePost(p, userId)));
    }

    // if it is not in redis, fetch from mongodb
    const posts = await Post.find();

    // then we will store it in redis for next time
    try {
      await redis.set("posts", JSON.stringify(posts), {
        EX: 600,
      });
    } catch (err) {
      console.log("❌ Redis cache write failed:", err);
    }

    console.log("✅ Posts fetched from MongoDB and cached in Redis");
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

// ✏️ Update one post
app.put("/posts/:id", requireAuth, async (req, res) => {
  try {
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // return updated document
    );
    if (!updatedPost) return res.status(404).json({ message: "Post not found" });
    await redis.del("posts");
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

    await redis.del("posts");
    await redis.del(`post:${id}`);
    res.json(shapePost(updated, userId));
  } catch (err) {
    console.error("❌ PATCH /posts error:", err);
    res.status(500).json({ error: "Failed to update like" });
  }
});



// 🗑️ Delete one post
app.delete("/posts/:id", requireAuth, async (req, res) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.id);
    if (!deletedPost) return res.status(404).json({ message: "Post not found" });
    await redis.del("posts");
    await redis.del(`post:${req.params.id}`);
    res.status(200).json({ message: "✅ Post deleted", post: deletedPost });
  } catch (error) {
    res.status(500).json({ message: "❌ Error deleting post", error });
  }
});

// 🧹 Delete all posts
app.delete("/posts", requireAuth, async (req, res) => {
  try {
    const result = await Post.deleteMany({});
    await redis.del("posts");
    res.status(200).json({
      message: `✅ All posts deleted successfully (${result.deletedCount} deleted)`
    });
  } catch (error) {
    res.status(500).json({ message: "❌ Error deleting all posts", error });
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
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
