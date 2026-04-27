import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";

// --- Connect to MongoDB ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log(err));

const corsOptions = {
  origin: "*", // Allow requests from your frontend
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

const uploadUser = multer({ storage: createStorage(userUploadDir) });
const uploadPost = multer({ storage: createStorage(postUploadDir) });

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
  readTime: String,
});
const Post = mongoose.model("Post", postSchema);

// --- Upload User Image ---
app.post("/upload/user", uploadUser.single("image"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ message: "No image file uploaded" });

  const url = `BASE_URL/uploads/user/${req.file.filename}`;
  res.status(200).json({ message: "✅ User image uploaded", url });
});

// --- Upload Post Image ---
app.post("/upload/post", uploadPost.single("image"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ message: "No image file uploaded" });

  const url = `${process.env.BASE_URL}/uploads/post/${req.file.filename}`;
  res.status(200).json({ message: "✅ Post image uploaded", url });
});



// ➕ Create one or many posts
app.post("/posts", async (req, res) => {
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
    res.status(201).json({message: "inserted Pots:- ", posts})
  } catch (error) {
    console.error("❌ Backend error while creating post:", error);
    res.status(500).json({ message: "❌ Error creating post(s)", error });
  }
});

// 📖 Get all posts
app.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find();
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "❌ Error fetching posts", error });
  }
});

// 📖 Get one post by ID
app.get("/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: "❌ Error fetching post", error });
  }
});

// ✏️ Update one post
app.put("/posts/:id", async (req, res) => {
  try {
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // return updated document
    );
    if (!updatedPost) return res.status(404).json({ message: "Post not found" });
    res.status(200).json({ message: "✅ Post updated", post: updatedPost });
  } catch (error) {
    res.status(500).json({ message: "❌ Error updating post", error });
  }
});

// for increase like count when clicked and to decrease when it was clicked
app.patch("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { inc } = req.body;

    console.log("PATCH request:", { id, inc }); // 🧩 Debug log

    if (typeof inc !== "number" || ![1, -1].includes(inc)) {
      return res.status(400).json({ error: "Invalid like change value" });
    }

    const updated = await Post.findByIdAndUpdate(
      id,
      { $inc: { "like.count": inc } },
      { new: true }
    );
    console.log("PATCH request body:", req.body);
    if (!updated) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("❌ PATCH /posts error:", err); // <== add this line
    res.status(500).json({ error: "Failed to update like" });
  }
});



// 🗑️ Delete one post
app.delete("/posts/:id", async (req, res) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.id);
    if (!deletedPost) return res.status(404).json({ message: "Post not found" });
    res.status(200).json({ message: "✅ Post deleted", post: deletedPost });
  } catch (error) {
    res.status(500).json({ message: "❌ Error deleting post", error });
  }
});

// 🧹 Delete all posts
app.delete("/posts", async (req, res) => {
  try {
    const result = await Post.deleteMany({});
    res.status(200).json({
      message: `✅ All posts deleted successfully (${result.deletedCount} deleted)`
    });
  } catch (error) {
    res.status(500).json({ message: "❌ Error deleting all posts", error });
  }
});


// ✅ Start the server
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
