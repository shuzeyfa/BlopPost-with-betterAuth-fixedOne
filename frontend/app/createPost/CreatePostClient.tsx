"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authHeader } from "@/lib/apiClient";

interface CreatePostClientProps {
  session: any;
}

export default function CreatePostClient({ session }: CreatePostClientProps) {
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    image: "",
    imageType: "url", // 👈 user can choose URL or upload
  });

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = formData.image;

      // 🖼️ If user uploaded file, send it to backend first
      if (formData.imageType === "upload" && file) {
        const fileData = new FormData();
        fileData.append("image", file);

        const uploadRes = await fetch(`${baseUrl}/upload/post`, {
          method: "POST",
          headers: await authHeader(),
          body: fileData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.message);
        imageUrl = uploadData.url; // backend returns image URL
      }

      const newPost = {
        image: imageUrl,
        category: formData.category,
        title: formData.title,
        description: formData.description,
        author: {
          name: session?.user?.name,
          img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
        },
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        like: { count: 0, isliked: false },
        readTime: "",
      };

      const res = await fetch(`${baseUrl}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeader()),
        },
        body: JSON.stringify(newPost),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create post");

      alert("✅ Post created successfully!");
      router.push("/");
    } catch (error) {
      console.error("❌ Error creating post:", error);
      alert("❌ Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full bg-canvas border border-edge-heavy text-ink placeholder:text-ash-dim px-3 py-2.5 focus:outline-none focus:border-em transition-colors";
  const labelStyle =
    "block font-mono text-xs uppercase tracking-[0.2em] text-ash mb-2";

  return (
    <main className="min-h-screen bg-canvas text-ink py-12 px-4 grid-texture">
      <div className="max-w-3xl mx-auto bg-panel border border-edge p-8 animate-rise">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-em mb-3">
          [ New Entry ]
        </p>
        <h1 className="text-3xl font-bold mb-8 tracking-tight">Create a New Post</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className={labelStyle}>Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              maxLength={100}
              required
              placeholder="Enter post title"
              className={inputStyle}
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelStyle}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              maxLength={400}
              required
              placeholder="Write your post content..."
              rows={5}
              className={inputStyle}
            />
          </div>

          {/* Category */}
          <div>
            <label className={labelStyle}>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className={inputStyle}
            >
              <option value="">Select category</option>
              <option value="Technology">Technology</option>
              <option value="Design">Design</option>
              <option value="JavaScript">JavaScript</option>
              <option value="Leadership">Leadership</option>
              <option value="Cloud">Cloud</option>
              <option value="UI/UX">UI/UX</option>
            </select>
          </div>

          {/* Image Upload Type */}
          <div className="flex gap-6 text-sm text-ash">
            <label className="flex items-center gap-2 cursor-pointer hover:text-ink transition-colors">
              <input
                type="radio"
                name="imageType"
                value="url"
                checked={formData.imageType === "url"}
                onChange={handleChange}
                className="accent-em"
              />
              Use Image URL
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-ink transition-colors">
              <input
                type="radio"
                name="imageType"
                value="upload"
                checked={formData.imageType === "upload"}
                onChange={handleChange}
                className="accent-em"
              />
              Upload from device
            </label>
          </div>

          {/* Image Input */}
          {formData.imageType === "url" ? (
            <div>
              <label className={labelStyle}>Image URL</label>
              <input
                type="text"
                name="image"
                value={formData.image}
                onChange={handleChange}
                required
                placeholder="Paste image URL (e.g. from Unsplash)"
                className={inputStyle}
              />
            </div>
          ) : (
            <div>
              <label className={labelStyle}>Upload Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
                className={`${inputStyle} file:mr-3 file:border-0 file:bg-em file:text-canvas file:px-3 file:py-1 file:font-medium file:cursor-pointer`}
              />
            </div>
          )}

          {/* Author */}
          <div>
            <label className={labelStyle}>Author</label>
            <input
              type="text"
              value={session?.user?.name || ""}
              disabled
              className="w-full bg-panel-2 border border-edge text-ash-dim px-3 py-2.5 cursor-not-allowed"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-em text-canvas py-3 font-medium hover:bg-em-light transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Post →"}
          </button>
        </form>
      </div>
    </main>
  );
}
