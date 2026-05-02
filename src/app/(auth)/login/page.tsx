import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Olive Linen account.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; email?: string }>;
}) {
  const { next, email } = await searchParams;

  return (
    <div>
      <p className="eyebrow mb-4">Welcome back</p>
      <h1 className="font-display text-display-md text-olive-900 leading-[1.05]">
        Sign in to <span className="italic font-light">Olive.</span>
      </h1>
      <p className="mt-4 text-olive-700/80 leading-relaxed">
        Manage your booking, pay your balance, upload your timeline and chat with the studio.
      </p>

      <div className="mt-10">
        <SignInForm next={next} defaultEmail={email} />
      </div>

      <div className="my-10 flex items-center gap-4">
        <div className="flex-1 h-px bg-[color:var(--color-rule)]" />
        <span className="text-[11px] uppercase tracking-[0.16em] text-olive-500">or</span>
        <div className="flex-1 h-px bg-[color:var(--color-rule)]" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href={`/signup${
            next || email
              ? `?${[
                  next ? `next=${encodeURIComponent(next)}` : "",
                  email ? `email=${encodeURIComponent(email)}` : "",
                ]
                  .filter(Boolean)
                  .join("&")}`
              : ""
          }`}
          className="btn btn-secondary !py-3"
        >
          Create account
        </Link>
        <Link href="/trade/apply" className="btn btn-secondary !py-3">Trade application</Link>
      </div>

      <p className="mt-10 text-[11px] uppercase tracking-[0.14em] text-olive-500 leading-relaxed">
        By continuing you agree to our{" "}
        <Link href="/legal/terms" className="lnk">terms</Link> and{" "}
        <Link href="/legal/privacy" className="lnk">privacy</Link>.
      </p>
    </div>
  );
}
