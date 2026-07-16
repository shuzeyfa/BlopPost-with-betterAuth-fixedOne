import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import Link from "next/link";
import HomeClient from "./component/HomeClient";

export default async function Home() {

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session){
    return (
      <div className="relative min-h-screen bg-canvas text-ink overflow-hidden grid-texture">
        {/* accent glow */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-em/10 blur-[160px]" />

        {/* top bar */}
        <header className="relative z-10 border-b border-edge">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center bg-em font-mono text-sm font-bold text-canvas">
                B
              </span>
              <span className="font-semibold tracking-tight">
                Blog<span className="text-em">Craft</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/signin"
                className="px-4 py-2 text-sm text-ash hover:text-ink transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-medium bg-em text-canvas hover:bg-em-light transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </header>

        {/* hero */}
        <main className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-20">
          <p className="animate-rise rise-1 font-mono text-xs uppercase tracking-[0.3em] text-em mb-6">
            [ A modern publishing platform ]
          </p>

          <h1 className="animate-rise rise-2 text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            Stories worth writing,
            <br />
            <span className="text-ash">built to be read.</span>
          </h1>

          <p className="animate-rise rise-3 mt-8 max-w-xl text-lg text-ash leading-relaxed">
            BlogCraft is where developers, designers, and leaders share what
            they know — long-form ideas on technology, design, and everything
            in between.
          </p>

          <div className="animate-rise rise-4 mt-10 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="px-7 py-3 bg-em text-canvas font-medium hover:bg-em-light transition-colors"
            >
              Start Writing →
            </Link>
            <Link
              href="/signin"
              className="px-7 py-3 border border-edge-heavy text-ink font-medium hover:border-em hover:text-em transition-colors"
            >
              Sign In
            </Link>
          </div>

          {/* stats strip */}
          <div className="animate-rise rise-4 mt-24 grid grid-cols-2 md:grid-cols-4 border border-edge divide-x divide-edge bg-panel/60 backdrop-blur">
            {[
              ["06", "Categories covered"],
              ["10 min", "Average read time"],
              ["Open", "For every writer"],
              ["24/7", "Always available"],
            ].map(([stat, label]) => (
              <div key={label} className="p-6">
                <div className="font-mono text-2xl text-em">{stat}</div>
                <div className="mt-1 text-xs uppercase tracking-widest text-ash-dim">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }
  return <HomeClient />
}
