import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-canvas grid place-items-center px-6 py-16">
      <div className="max-w-xl text-center">
        <Link href="/" aria-label="Olive Linen — home" className="inline-block text-olive-900">
          <Wordmark className="h-8 w-auto" />
        </Link>
        <p className="eyebrow mt-12 mb-6 text-clay-500">404</p>
        <h1 className="font-display text-display-xl text-olive-900 leading-[0.96]">
          We can't find that <span className="italic font-light">napkin.</span>
        </h1>
        <p className="mt-6 text-olive-700/80 leading-relaxed">
          The page you were looking for has been folded away. Try the front door —
          we'll show you back to the table.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="btn">Back to home</Link>
          <Link href="/hire" className="btn btn-secondary">Start a hire</Link>
        </div>
      </div>
    </main>
  );
}
