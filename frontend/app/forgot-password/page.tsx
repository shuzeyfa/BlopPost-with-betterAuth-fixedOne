"use client";

import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { forgotPasswordAction } from "../actions/actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full h-11 flex items-center justify-center bg-em text-canvas font-medium hover:bg-em-light transition-colors ${pending ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Sending link...
        </>
      ) : (
        <>
          Send Reset Link <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(forgotPasswordAction, null);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-canvas grid-texture">
      <div className="pointer-events-none absolute top-20 left-20 w-72 h-72 bg-em/10 blur-[140px] rounded-full" />

      <div className="relative z-10 w-full max-w-md border border-edge bg-panel/80 backdrop-blur-xl p-8 animate-rise">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <span className="flex h-10 w-10 items-center justify-center bg-em font-mono text-lg font-bold text-canvas">
              B
            </span>
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-em mb-3">
            [ Password Reset ]
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            Forgot password?
          </h1>
          <p className="text-ash mt-2">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            className="w-full h-11 px-3 bg-canvas border border-edge-heavy text-ink placeholder:text-ash-dim focus:outline-none focus:border-em transition-colors"
          />

          {state?.error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2">
              {state.error}
            </p>
          )}
          {state?.success && (
            <p className="text-sm text-em bg-em/10 border border-em/30 px-3 py-2">
              {state.success}
            </p>
          )}

          <SubmitButton />
        </form>

        <p className="text-center text-sm text-ash mt-6">
          Remembered it?{" "}
          <Link href="/signin" className="font-semibold text-em hover:text-em-light transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
