import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your Olive Linen account.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div>
      <p className="eyebrow mb-4">New here</p>
      <h1 className="font-display text-display-md text-olive-900 leading-[1.05]">
        Create your <span className="italic font-light">Olive</span> account.
      </h1>
      <p className="mt-4 text-olive-700/80 leading-relaxed">
        For couples planning a wedding or event. Trade clients — planners, stylists, venues —
        please apply via{" "}
        <Link href="/trade/apply" className="lnk">our trade portal</Link>.
      </p>

      <div className="mt-10">
        <SignUpForm next={next} />
      </div>

      <p className="mt-8 text-sm text-olive-700">
        Already have an account?{" "}
        <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="lnk">Sign in</Link>
      </p>
    </div>
  );
}
