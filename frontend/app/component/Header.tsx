"use client";

import { useEffect, useState } from "react";
import { signOutAction } from "../actions/actions";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/16/solid";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/authClient";

type headerProps = {
  value: string;
};

const NAV_LINKS = [
  { href: "/", label: "All Posts", key: "allpost" },
  { href: "/profile", label: "Profile", key: "profile" },
  { href: "/about", label: "About", key: "about" },
];

export default function Header({ value }: headerProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const [session, setSession] = useState({
    name: "",
    email: "",
    bio: "",
    image: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      const session = await authClient.getSession();
      const data = session?.data?.user;
      setSession({
        name: data?.name || "",
        email: data?.email || "",
        bio: data?.bio || "",
        image: data?.image || "",
      });
    };
    fetchUser();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-edge bg-canvas/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center py-3.5 px-6">
        {/* Hamburger for mobile view */}
        <div className="lg:hidden">
          {menuOpen ? (
            <XMarkIcon
              className="h-6 w-6 text-ash cursor-pointer hover:text-ink transition-colors"
              onClick={() => setMenuOpen(false)}
            />
          ) : (
            <Bars3Icon
              className="h-6 w-6 text-ash cursor-pointer hover:text-ink transition-colors"
              onClick={() => setMenuOpen(true)}
            />
          )}
        </div>

        {menuOpen && (
          <div className="absolute top-14 left-4 bg-panel border border-edge shadow-2xl shadow-black/60 flex flex-col items-start p-4 space-y-3 lg:hidden">
            {[...NAV_LINKS, { href: "/createPost", label: "New Post", key: "newpost" }].map(
              (link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`font-mono text-xs uppercase tracking-[0.2em] transition-colors ${
                    value === link.key ? "text-em" : "text-ash hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              ),
            )}
          </div>
        )}

        {/* Left section - Logo */}
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center bg-em font-mono text-sm font-bold text-canvas">
            B
          </span>
          <span className="text-lg font-semibold tracking-tight text-ink">
            Blog<span className="text-em">Craft</span>
          </span>
        </Link>

        <nav className="hidden lg:flex gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={`font-mono text-xs uppercase tracking-[0.2em] py-1 border-b transition-colors ${
                value === link.key
                  ? "text-em border-em"
                  : "text-ash border-transparent hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right section - Buttons + Profile */}
        <div className="flex items-center gap-3">
          {/* New Post Button */}
          <button
            onClick={() => router.push("/createPost")}
            className="hidden md:flex items-center gap-2 bg-em text-canvas px-4 py-2 text-sm font-medium hover:bg-em-light cursor-pointer transition-colors"
          >
            <span>＋</span> New Post
          </button>

          {/* Profile Image */}
          <img
            className="w-9 h-9 rounded-full object-cover border border-edge-heavy cursor-pointer hover:border-em transition-colors"
            src={session.image || "https://images.unsplash.com/photo-1559028012-481c04fa702d?w=800"}
            alt="Profile"
            onClick={() => router.push("/profile")}
          />

          {/* Logout Button */}
          <button
            onClick={signOutAction}
            className="px-4 py-2 text-sm border border-edge-heavy text-ash hover:text-ink hover:border-em cursor-pointer transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
