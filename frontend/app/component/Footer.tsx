"use client";


import { FaGithub, FaLinkedin } from "react-icons/fa";



export default function Footer() {
  return (
    <footer className="mt-20 border-t border-edge bg-canvas text-ash">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 px-6 py-14 text-sm">
            <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-8 w-8 items-center justify-center bg-em font-mono text-sm font-bold text-canvas">
                B
              </span>
              <h3 className="text-lg font-semibold text-ink">
                Blog<span className="text-em">Craft</span>
              </h3>
            </div>
            <p className="text-ash-dim leading-relaxed">
                A Modern Platform for sharing knowledge, insights, and stories.
                Join our community of writers and readers.
            </p>
            <div className="mt-5 flex gap-4 text-xl">
                <a
                href="https://github.com/shuzeyfa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ash-dim hover:text-em transition-colors"
                >
                <FaGithub />
                </a>
                <a
                href="https://www.linkedin.com/in/huzeyfa-suleyman"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ash-dim hover:text-em transition-colors"
                >
                <FaLinkedin />
                </a>
            </div>
            </div>

            <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-ink mb-4">Categories</h4>
            <ul className="space-y-2 text-ash-dim">
                <li className="hover:text-em transition-colors cursor-default">Technology</li>
                <li className="hover:text-em transition-colors cursor-default">Design</li>
                <li className="hover:text-em transition-colors cursor-default">Leadership</li>
                <li className="hover:text-em transition-colors cursor-default">Cloud</li>
                <li className="hover:text-em transition-colors cursor-default">UI/UX</li>
            </ul>
            </div>

            <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-ink mb-4">Company</h4>
            <ul className="space-y-2 text-ash-dim">
                <li className="hover:text-em transition-colors cursor-default">About Us</li>
                <li className="hover:text-em transition-colors cursor-default">Contact</li>
                <li className="hover:text-em transition-colors cursor-default">Privacy Policy</li>
                <li className="hover:text-em transition-colors cursor-default">Terms of Service</li>
            </ul>
            </div>
        </div>
        <div className="border-t border-edge py-6 text-center font-mono text-xs uppercase tracking-widest text-ash-dim">
            © {new Date().getFullYear()} BlogCraft — All rights reserved
        </div>
    </footer>
  );
}
