import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-canvas grid grid-cols-1 lg:grid-cols-12">
      <aside className="hidden lg:block lg:col-span-5 xl:col-span-6 relative bg-olive-900 text-cream-100 p-12 xl:p-16">
        <Link href="/" aria-label="Home" className="inline-block">
          <Wordmark className="h-9 w-auto" />
        </Link>
        <div className="absolute inset-x-12 xl:inset-x-16 bottom-12">
          <p className="font-display italic text-cream-100/85 text-4xl leading-[1.1]">
            Like the olive
            <span className="block">to your martini.</span>
          </p>
          <p className="mt-6 max-w-sm text-cream-100/65 leading-relaxed">
            Sign in to manage your booking, pay your balance, upload your timeline and message the studio.
          </p>
        </div>
      </aside>

      <main className="lg:col-span-7 xl:col-span-6 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-10">
            <Link href="/" aria-label="Home" className="inline-block text-olive-900">
              <Wordmark className="h-7 w-auto" />
            </Link>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
