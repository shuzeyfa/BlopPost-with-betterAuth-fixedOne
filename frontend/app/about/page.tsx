"use client";

import { useEffect, useState, useRef } from "react";
import Header from "@/app/component/Header"
import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";

export default function About() {
  const [counters, setCounters] = useState({
    projects: 0,
    problems: 0,
    hours: 0,
  });

  const counterRef = useRef<HTMLDivElement | null>(null);
  const [started, setStarted] = useState(false);

  

  // Animate numbers when section becomes visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !started) {
          setStarted(true);
          animateCounters();
        }
      },
      { threshold: 0.5 }
    );

    if (counterRef.current) observer.observe(counterRef.current);
    return () => {
      if (counterRef.current) observer.unobserve(counterRef.current);
    };
  }, [started]);

  const animateCounters = () => {
    const duration = 1500; // total animation time in ms
    const steps = 60; // number of frames
    const incrementProjects = 10 / steps; // target: 10 projects
    const incrementProblems = 1000 / steps; // target: 1000 problems
    const incrementHours = 1000 / steps; // target: 1000+ hours
    let current = 0;

    const timer = setInterval(() => {
      current++;
      setCounters({
        projects: Math.min(Math.round(current * incrementProjects), 10),
        problems: Math.min(Math.round(current * incrementProblems), 1000),
        hours: Math.min(Math.round(current * incrementHours), 1000),
      });

      if (current >= steps) clearInterval(timer);
    }, duration / steps);
  };

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <Header value={"about"} />

      {/* Hero Section */}
      <section className="relative py-20 border-b border-edge grid-texture text-center overflow-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-em/10 blur-[150px]" />
        <div className="relative max-w-3xl mx-auto px-6">
          <p className="animate-rise rise-1 font-mono text-xs uppercase tracking-[0.3em] text-em mb-5">
            [ About Me ]
          </p>
          <h1 className="animate-rise rise-2 text-5xl font-bold tracking-tight mb-6">
            Huzeyfa Suleyman
          </h1>
          <p className="animate-rise rise-3 text-lg text-ash leading-relaxed">
            A <span className="text-em font-medium">Full-Stack Developer</span> passionate
            about building performant and scalable web applications. I have solved{" "}
            <span className="text-ink font-semibold">1000+ problems</span> on Codeforces and
            LeetCode. My goal is to create meaningful digital experiences that connect users
            with technology seamlessly.
          </p>
        </div>
      </section>

      {/* Bio Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
        <img
          src="/image/owner.jpg"
          alt="Huzeyfa Suleyman"
          className="border border-edge object-cover w-[90%] h-[400px] grayscale hover:grayscale-0 transition-all duration-500"
        />
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-em mb-4">
            [ Who I Am ]
          </p>
          <h2 className="text-3xl font-bold tracking-tight mb-5">
            Builder, problem solver
          </h2>
          <p className="text-ash leading-relaxed mb-4">
            I'm a self-driven Full-Stack Developer with expertise in{" "}
            <span className="text-ink font-medium">Next.js, Node.js, React, and MongoDB</span>.
            I focus on building intuitive, scalable, and dynamic web applications.
            Beyond development, I love solving algorithmic challenges — having completed
            over 1000 problems on platforms like Codeforces and LeetCode.
          </p>
          <p className="text-ash leading-relaxed">
            My approach combines clean code, user-friendly interfaces, and optimal
            performance to deliver real-world solutions. When I'm not coding, I explore
            UI animations, open-source projects, and performance optimization techniques.
          </p>
        </div>
      </section>

      {/* Animated Counters */}
      <section
        ref={counterRef}
        className="border-y border-edge bg-panel"
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-edge text-center">
          <div className="py-14 px-6">
            <h3 className="font-mono text-5xl font-bold text-em">
              {counters.projects}+
            </h3>
            <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-ash-dim">
              Projects Completed
            </p>
          </div>
          <div className="py-14 px-6">
            <h3 className="font-mono text-5xl font-bold text-em">
              {counters.problems.toLocaleString()}+
            </h3>
            <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-ash-dim">
              Problems Solved
            </p>
          </div>
          <div className="py-14 px-6">
            <h3 className="font-mono text-5xl font-bold text-em">
              {counters.hours}+
            </h3>
            <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-ash-dim">
              Hours of Practice
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-em mb-4">
          [ Start a Conversation ]
        </p>
        <h2 className="text-3xl font-bold tracking-tight mb-4">
          Let's Connect
        </h2>
        <p className="text-ash mb-8 max-w-xl mx-auto">
          I'm open to freelance work, collaborations, or simply having a chat about web
          development.
        </p>
        <div className="flex justify-center gap-6 text-2xl">
          <a
            href="https://github.com/shuzeyfa"
            target="_blank"
            className="text-ash hover:text-em transition-colors"
          >
            <FaGithub />
          </a>
          <a
            href="https://www.linkedin.com/in/huzeyfa-suleyman"
            target="_blank"
            className="text-ash hover:text-em transition-colors"
          >
            <FaLinkedin />
          </a>
          <a
            href="mailto:shuzeyfa4@gmail.com"
            className="text-ash hover:text-em transition-colors"
          >
            <FaEnvelope />
          </a>
        </div>
      </section>
    </main>
  );
}
