"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Heart, ArrowLeft, Loader2, Trash2, Send } from "lucide-react";
import Header from "@/app/component/Header";
import Footer from "@/app/component/Footer";
import { authHeader } from "@/lib/apiClient";
import { authClient } from "@/lib/authClient";

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

type Comment = {
  _id: string;
  postId: string;
  authorId: string;
  author: { name: string; img: string };
  text: string;
  createdAt: string;
};

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [commentError, setCommentError] = useState("");
  const { data: session } = authClient.useSession();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const headers = await authHeader();
        const res = await fetch(`${baseUrl}/posts/${id}`, { headers });

        if (!res.ok) {
          setNotFound(true);
          return;
        }

        setPost(await res.json());
      } catch (error) {
        console.error("Error fetching post:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    const fetchComments = async () => {
      try {
        const res = await fetch(`${baseUrl}/posts/${id}/comments`);
        if (res.ok) {
          const data = await res.json();
          setComments(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };

    fetchPost();
    fetchComments();
  }, [baseUrl, id]);

  const handleLike = async () => {
    if (!post?._id) return;

    const inc = post.like.isliked ? -1 : 1;

    // Optimistic UI update — the server decides the real toggle per user
    setPost((prev) =>
      prev
        ? {
            ...prev,
            like: { count: prev.like.count + inc, isliked: !prev.like.isliked },
          }
        : prev,
    );

    try {
      const res = await fetch(`${baseUrl}/posts/${post._id}`, {
        method: "PATCH",
        headers: await authHeader(),
      });

      // sync with the server's authoritative result
      if (res.ok) setPost(await res.json());
    } catch (err) {
      console.error("❌ Error updating like:", err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || posting) return;

    setPosting(true);
    setCommentError("");
    try {
      const headers = await authHeader();
      const res = await fetch(`${baseUrl}/posts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCommentError(data.message || "Failed to post comment");
        return;
      }

      setComments((prev) => [...prev, data]);
      setCommentText("");
    } catch (err) {
      console.error("❌ Error posting comment:", err);
      setCommentError("Failed to post comment. Try again.");
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`${baseUrl}/comments/${commentId}`, {
        method: "DELETE",
        headers: await authHeader(),
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      }
    } catch (err) {
      console.error("❌ Error deleting comment:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <p className="flex items-center gap-3 font-mono text-sm uppercase tracking-[0.3em] text-ash animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading post...
        </p>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <main className="min-h-screen bg-canvas text-ink">
        <Header value={"allpost"} />
        <div className="max-w-3xl mx-auto px-6 py-32 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-em mb-4">
            [ 404 ]
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Post not found</h1>
          <p className="text-ash mt-3">
            This post may have been deleted or the link is wrong.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-8 px-6 py-3 border border-edge-heavy text-ash font-mono text-xs uppercase tracking-[0.2em] hover:border-em hover:text-em transition-colors"
          >
            <ArrowLeft size={14} /> Back to posts
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <Header value={"allpost"} />

      <article className="max-w-4xl mx-auto px-6 py-12">
        {/* Back link */}
        <Link
          href="/"
          className="animate-rise rise-1 inline-flex items-center gap-2 text-ash-dim font-mono text-xs uppercase tracking-[0.2em] hover:text-em transition-colors mb-10"
        >
          <ArrowLeft size={14} /> All posts
        </Link>

        {/* Meta */}
        <div className="animate-rise rise-1 flex items-center gap-3 font-mono text-xs mb-6">
          <span className="uppercase tracking-widest text-em border border-edge-heavy px-3 py-1.5">
            {post.category}
          </span>
          {post.readTime && <span className="text-ash-dim">• {post.readTime}</span>}
        </div>

        {/* Title */}
        <h1 className="animate-rise rise-2 text-3xl md:text-5xl font-bold tracking-tight leading-tight">
          {post.title}
        </h1>

        {/* Author strip */}
        <div className="animate-rise rise-3 flex items-center justify-between mt-8 pb-8 border-b border-edge">
          <div className="flex items-center gap-3">
            <img
              src={post.author.img}
              alt={post.author.name}
              className="w-10 h-10 rounded-full object-cover border border-edge-heavy"
            />
            <div className="flex flex-col leading-tight">
              <span className="font-medium text-ink">{post.author.name}</span>
              <span className="font-mono text-xs text-ash-dim">{post.date}</span>
            </div>
          </div>

          <button
            onClick={handleLike}
            className="flex items-center gap-2 px-4 py-2 border border-edge-heavy text-ash hover:border-em hover:text-em transition-colors cursor-pointer"
          >
            <Heart
              fill={post.like.isliked ? "#10b981" : "none"}
              stroke={post.like.isliked ? "#10b981" : "currentColor"}
              size={18}
            />
            <span className="font-mono text-sm">{post.like.count}</span>
          </button>
        </div>

        {/* Cover image */}
        <div className="animate-rise rise-4 mt-10 border border-edge overflow-hidden">
          <img
            src={post.image}
            alt={post.title}
            className="w-full max-h-[480px] object-cover"
          />
        </div>

        {/* Body */}
        <p className="animate-rise rise-4 mt-10 text-lg text-ash leading-relaxed whitespace-pre-line">
          {post.description}
        </p>

        {/* Comments */}
        <section className="mt-16 pt-10 border-t border-edge">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-em mb-2">
            [ Discussion ]
          </p>
          <h2 className="text-2xl font-bold tracking-tight mb-8">
            Comments <span className="text-ash-dim font-mono text-lg">({comments.length})</span>
          </h2>

          {/* Add comment form */}
          <form onSubmit={handleAddComment} className="mb-10">
            <div className="flex gap-3">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts..."
                maxLength={500}
                className="flex-1 h-11 px-3 bg-panel border border-edge-heavy text-ink placeholder:text-ash-dim focus:outline-none focus:border-em transition-colors"
              />
              <button
                type="submit"
                disabled={posting || !commentText.trim()}
                className={`h-11 px-5 flex items-center gap-2 bg-em text-canvas font-medium hover:bg-em-light transition-colors ${
                  posting || !commentText.trim()
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                {posting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                Post
              </button>
            </div>
            {commentError && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 mt-3">
                {commentError}
              </p>
            )}
          </form>

          {/* Comment list */}
          {comments.length === 0 ? (
            <p className="text-ash-dim font-mono text-sm">
              No comments yet — be the first to share your thoughts.
            </p>
          ) : (
            <ul className="space-y-5">
              {comments.map((comment) => (
                <li
                  key={comment._id}
                  className="bg-panel border border-edge p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={comment.author.img}
                        alt={comment.author.name}
                        className="w-8 h-8 rounded-full object-cover border border-edge-heavy"
                      />
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium text-ink text-sm">
                          {comment.author.name}
                        </span>
                        <span className="font-mono text-xs text-ash-dim">
                          {new Date(comment.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    {session?.user?.id === comment.authorId && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="text-ash-dim hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete comment"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <p className="text-ash text-sm leading-relaxed mt-3">
                    {comment.text}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </article>

      <Footer />
    </main>
  );
}
