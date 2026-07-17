import Link from "next/link";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-canvas grid-texture">
      <div className="pointer-events-none absolute top-20 left-20 w-72 h-72 bg-em/10 blur-[140px] rounded-full" />

      <div className="relative z-10 w-full max-w-md border border-edge bg-panel/80 backdrop-blur-xl p-8 text-center animate-rise">
        <div className="flex justify-center mb-5">
          <span className="flex h-10 w-10 items-center justify-center bg-em font-mono text-lg font-bold text-canvas">
            B
          </span>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-em mb-3">
          [ Check your inbox ]
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Verify your email
        </h1>
        <p className="text-ash mt-4 leading-relaxed">
          We sent a verification link to{" "}
          {email ? (
            <span className="text-ink font-medium">{email}</span>
          ) : (
            "your email address"
          )}
          . Click the link in the email to activate your account.
        </p>
        <p className="text-ash-dim text-sm mt-4">
          The link expires in 1 hour. Check your spam folder if you don't see it.
        </p>

        <p className="text-center text-sm text-ash mt-8">
          Already verified?{" "}
          <Link
            href="/signin"
            className="font-semibold text-em hover:text-em-light transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
