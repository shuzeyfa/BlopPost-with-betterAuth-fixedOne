"use client";

import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { useFormStatus } from "react-dom";
import { signUpAction } from "../actions/actions";
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
          Creating account...
        </>
      ) : (
        <>
          Create Account <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  );
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-white">
      
      {/* Glow effects */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-pink-300/40 blur-[120px] rounded-full" />
      <div className="absolute bottom-20 left-20 w-72 h-72 bg-cyan-300/40 blur-[120px] rounded-full" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-gray-200 bg-white/70 backdrop-blur-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Create account
          </h1>
          <p className="text-gray-500 mt-2">
            Start sharing your ideas today.
          </p>
        </div>

        <form action={signUpAction} className="space-y-4">
          <Input type="text" name="name" placeholder="Full Name" required />
          <Input type="email" name="email" placeholder="Email" required />
          <Input type="password" name="password" placeholder="Password" required />

          <SubmitButton />
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/signin" className="font-semibold text-black">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}