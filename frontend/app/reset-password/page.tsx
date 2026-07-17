"use client";

import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { useFormStatus } from "react-dom";
import { useActionState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { resetPasswordAction } from "../actions/actions";

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
          Resetting...
        </>
      ) : (
        <>
          Reset Password <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </button>
  );
}

function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetPasswordAction, null);
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  return (
    <div className="relative z-10 w-full max-w-md border border-edge bg-panel/80 backdrop-blur-xl p-8 animate-rise">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-5">
          <span className="flex h-10 w-10 items-center justify-center bg-em font-mono text-lg font-bold text-canvas">
            B
          </span>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-em mb-3">
          [ New Password ]
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Reset password
        </h1>
        <p className="text-ash mt-2">
          Choose a new password for your account.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        <input
          type="password"
          name="password"
          placeholder="New password"
          required
          minLength={8}
          className="w-full h-11 px-3 bg-canvas border border-edge-heavy text-ink placeholder:text-ash-dim focus:outline-none focus:border-em transition-colors"
        />

        {state?.error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2">
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>

      <p className="text-center text-sm text-ash mt-6">
        Link expired?{" "}
        <Link href="/forgot-password" className="font-semibold text-em hover:text-em-light transition-colors">
          Request a new one
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-canvas grid-texture">
      <div className="pointer-events-none absolute bottom-20 right-20 w-72 h-72 bg-em/10 blur-[140px] rounded-full" />
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
