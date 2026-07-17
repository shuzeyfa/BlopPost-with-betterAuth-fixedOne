"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/component/Header";
import Footer from "@/app/component/Footer";
import PostCard from "@/app/component/PostCard";
import { authHeader } from "@/lib/apiClient";

type Post = {
  _id?: string;
  image: string;
  category: string;
  title: string;
  description: string;
  author: { name: string; img: string };
  date: string;
  like: { count: number; isliked: boolean };
  readTime: string;
};

export default function HomeClient() {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [activeFilter, setActiveFilter] = useState("All");
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  // ✅ Fetch posts on mount
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // send the session token so the backend can mark which posts
        // the current user has liked (isliked)
        const headers = await authHeader();
        const res = await fetch(`${baseUrl}/posts`, { headers });
        const data = await res.json();

        // ensure it's always an array
        if (!Array.isArray(data)) {
          console.error("Invalid posts response:", data);
          setAllPosts([]);
          return;
        }

        if (data.length === 0) {
          await fetch(`${baseUrl}/posts`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...headers,
            },
            body: JSON.stringify(INITIAL_POSTS),
          });

          const newRes = await fetch(`${baseUrl}/posts`, { headers });
          const newData = await newRes.json();

          setAllPosts(Array.isArray(newData) ? newData : []);
        } else {
          setAllPosts(data);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
        setAllPosts([]);
      }
    };

    fetchPosts();
  }, [baseUrl]);

  const handleSelectPost = (post: Post) => {
    if (post._id) router.push(`/posts/${post._id}`);
  };

  const handleLike = async (id: string) => {
    if (!id) return;

    const post = allPosts.find((p) => p._id === id);
    if (!post) return;

    const inc = post.like.isliked ? -1 : 1;

    // Optimistic UI update — the server decides the real toggle per user
    setAllPosts((prev) =>
      prev.map((p) =>
        p._id === id
          ? {
              ...p,
              like: {
                count: p.like.count + inc,
                isliked: !p.like.isliked,
              },
            }
          : p,
      ),
    );

    try {
      const res = await fetch(`${baseUrl}/posts/${id}`, {
        method: "PATCH",
        headers: await authHeader(),
      });

      // sync with the server's authoritative result
      if (res.ok) {
        const updated: Post = await res.json();
        setAllPosts((prev) => prev.map((p) => (p._id === id ? updated : p)));
      }
    } catch (err) {
      console.error("❌ Error updating like:", err);
    }
  };

  if (allPosts.length === 0) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <p className="font-mono text-sm uppercase tracking-[0.3em] text-ash animate-pulse">
          Loading posts...
        </p>
      </div>
    );
  }

  const filteredPosts =
    activeFilter === "All"
      ? Array.isArray(allPosts)
        ? allPosts
        : []
      : Array.isArray(allPosts)
        ? allPosts.filter((p) => p.category === activeFilter)
        : [];

  const visiblePosts = filteredPosts.slice(0, visibleCount);

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <Header value={"allpost"} />

      {/* Hero Section */}
      <section className="relative border-b border-edge grid-texture py-16 mb-10 overflow-hidden">
        <div className="pointer-events-none absolute -top-32 right-0 w-[420px] h-[420px] rounded-full bg-em/10 blur-[140px]" />
        <div className="relative max-w-7xl mx-auto px-6">
          <p className="animate-rise rise-1 font-mono text-xs uppercase tracking-[0.3em] text-em mb-4">
            [ The Journal ]
          </p>
          <h1 className="animate-rise rise-2 text-4xl md:text-6xl font-bold tracking-tight">
            All Posts
          </h1>
          <p className="animate-rise rise-3 mt-4 text-lg max-w-2xl text-ash leading-relaxed">
            Dive into our collection of insightful articles on technology,
            design, leadership, and more.
          </p>
        </div>
      </section>

      {/* Filter Buttons */}
      <div className="hidden md:block max-w-7xl mx-auto px-6 mb-10">
        <div className="flex flex-wrap gap-2">
          {["All", "Technology", "Design", "JavaScript", "Leadership", "Cloud", "UI/UX"].map(
            (category) => (
              <button
                key={category}
                onClick={() => {
                  setActiveFilter(category);
                  setVisibleCount(6);
                }}
                className={`px-4 py-1.5 font-mono text-xs uppercase tracking-widest border transition-colors cursor-pointer ${
                  activeFilter === category
                    ? "bg-em text-canvas border-em"
                    : "bg-transparent text-ash border-edge-heavy hover:border-em hover:text-em"
                }`}
              >
                {category}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Mobile Filter */}
      <div className="flex justify-end md:hidden max-w-7xl mx-auto px-6 mb-8 relative">
        <select
          onChange={(e) => {
            setActiveFilter(e.target.value);
            setVisibleCount(6);
          }}
          value={activeFilter}
          className="border border-edge-heavy bg-panel text-ink font-mono text-xs uppercase tracking-widest px-3 py-2 w-44 focus:outline-none focus:border-em"
          name="filter"
        >
          {["All", "Technology", "Design", "JavaScript", "Leadership", "Cloud", "UI/UX"].map(
            (cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ),
          )}
        </select>
      </div>

      {/* Posts Grid */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visiblePosts.map((post, index) => (
            <div
              onClick={() => handleSelectPost(post)}
              key={post._id ?? index}
              className="cursor-pointer"
            >
              <PostCard post={post} onLike={() => post._id && handleLike(post._id)} />
            </div>
          ))}
        </div>

        {visibleCount < filteredPosts.length && (
          <div className="flex justify-center mt-12">
            <button
              onClick={() => setVisibleCount(visibleCount + 3)}
              className="px-8 py-3 border border-edge-heavy text-ash font-mono text-xs uppercase tracking-[0.2em] hover:border-em hover:text-em transition-colors cursor-pointer"
            >
              Load More ↓
            </button>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}

// ✅ Default post data
const INITIAL_POSTS: Post[] = [
  {
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    category: "Technology",
    title: "The Rise of AI: How Artificial Intelligence is Changing the World",
    description:
      "Artificial Intelligence (AI) is transforming industries, from healthcare to finance. Learn how AI is reshaping human work and creativity.",
    author: { name: "John Doe", img: "https://randomuser.me/api/portraits/men/10.jpg" },
    date: "August 15, 2023",
    like: { count: 0, isliked: false },
    readTime: "",
  },
  {
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
    category: "Design",
    title: "Design Thinking: The Art of Solving Real Problems",
    description:
      "Discover how design thinking drives innovation and helps businesses build user-centered products.",
    author: { name: "Sarah Lee", img: "https://randomuser.me/api/portraits/women/20.jpg" },
    date: "September 2, 2023",
    like: { count: 0, isliked: false },
    readTime: "",
  },
];
