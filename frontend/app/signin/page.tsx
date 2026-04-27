"use client";

import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { useFormStatus } from "react-dom";
import { signInAction } from "../actions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className={`w-full h-11 rounded-xl bg-black text-white hover:bg-gray-900 ${pending ? "hover:cursor-not-allowed" : "cursor-pointer"} `}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        <>
          Sign In <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-white">
      
      {/* Glow effects */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-300/40 blur-[120px] rounded-full" />
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-blue-300/40 blur-[120px] rounded-full" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#f8fafc,white)]" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-gray-200 bg-white/70 backdrop-blur-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome back
          </h1>
          <p className="text-gray-500 mt-2">
            Continue writing your stories.
          </p>
        </div>

        <form action={signInAction} className="space-y-4">
          <Input type="email" name="email" placeholder="Email" required />
          <Input type="password" name="password" placeholder="Password" required />

          <SubmitButton />
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don’t have an account?{" "}
          <Link href="/signup" className="font-semibold text-black">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}