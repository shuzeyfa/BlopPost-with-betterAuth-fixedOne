"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/authClient";
import { authHeader } from "@/lib/apiClient";

export default function ProfilePage() {
  const [user, setUser] = useState({
    name: "",
    email: "",
    bio: "",
    image: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    image: "",
    imageType: "url",
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchUser = async () => {
      const session = await authClient.getSession();
      const data = session?.data?.user;
      setUser({
        name: data?.name || "",
        email: data?.email || "",
        bio: data?.bio || "",
        image: data?.image || "",
      });
    };
    fetchUser();
  }, []);

  // ✅ Fixed here
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      ...user,
      imageType: prev.imageType || "url",
    }));
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    let imageUrl = formData.image;

    // 🖼️ 1️⃣ Handle image upload if uploading
    if (formData.imageType === "upload" && file) {
      const fileData = new FormData();
      fileData.append("image", file);

      const uploadRes = await fetch(`${baseUrl}/upload/user`, {
        method: "POST",
        headers: await authHeader(),
        body: fileData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.message || "Upload failed");

      imageUrl = uploadData.url;
    }
    // 👤 2️⃣ Update user fields (name, image, maybe bio)
    const { data, error } = await authClient.updateUser({
      name: formData.name,
      image: imageUrl,
      bio: formData.bio,
    });

    // Fix: throw when there *is* an error
    if (error) {
      throw new Error(error.message || "Failed to update user");
    }
    console.log("✅ User updated:", data);  

    // 🔄 3️⃣ Refetch the updated session to refresh UI
    await authClient.getSession();

    const session = await authClient.getSession();
    console.log("🔄 Refetched session:", session);
    const updatedUser = session?.data?.user;
    if (updatedUser) {
      setUser({
        name: updatedUser.name || "",
        email: updatedUser.email || "",
        bio: updatedUser.bio || "",
        image: updatedUser.image || "",
      });

      setFormData({
        name: updatedUser.name || "",
        email: updatedUser.email || "",
        bio: updatedUser.bio || "",
        image: updatedUser.image || "",
        imageType: "url",
      });
    }

    alert("✅ Profile updated successfully!");
    setIsEditing(false);

  } catch (err: any) {
    console.error("❌ Error updating profile:", err);
    alert("❌ Failed to update profile: " + err.message);
  } finally {
    setLoading(false);
  }
};




  const inputStyle =
    "w-full bg-canvas border border-edge-heavy text-ink placeholder:text-ash-dim px-3 py-2.5 focus:outline-none focus:border-em transition-colors";
  const labelStyle =
    "block font-mono text-xs uppercase tracking-[0.2em] text-ash mb-2";

  return (
    <main className="min-h-screen bg-canvas text-ink grid-texture flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl bg-panel border border-edge p-8 animate-rise">
        {/* Header */}
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-em mb-6">
          [ Profile ]
        </p>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            {user.image ? (
              <img
                src={user.image}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-2 border-em"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-em text-canvas flex items-center justify-center text-4xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-ink">{user.name}</h1>
            <p className="font-mono text-sm text-ash-dim mt-1">{user.email}</p>
            <p className="mt-3 text-ash leading-relaxed">{user.bio || "No bio added yet."}</p>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`mt-5 px-5 py-2 font-medium transition-colors cursor-pointer ${
                isEditing
                  ? "border border-edge-heavy text-ash hover:text-ink hover:border-em"
                  : "bg-em text-canvas hover:bg-em-light"
              }`}
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>
        </div>

        {isEditing && (
          <>
            <hr className="my-8 border-edge" />
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className={labelStyle}>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={inputStyle}
                />
              </div>

              <div>
                <label className={labelStyle}>Email</label>
                <input
                  type="email"
                  name="email"
                  disabled
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-panel-2 border border-edge text-ash-dim px-3 py-2.5 cursor-not-allowed"
                />
              </div>

              <div>
                <label className={labelStyle}>Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  className={inputStyle}
                />
              </div>

              {/* Image type selection */}
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
                  <span>Use Image URL</span>
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
                  <span>Upload Image</span>
                </label>
              </div>

              {formData.imageType === "url" ? (
                <div>
                  <label className={labelStyle}>Image URL</label>
                  <input
                    type="text"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="Paste your image link"
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
                    className={`${inputStyle} file:mr-3 file:border-0 file:bg-em file:text-canvas file:px-3 file:py-1 file:font-medium file:cursor-pointer`}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-em text-canvas py-3 font-medium hover:bg-em-light transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Save Changes →"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
