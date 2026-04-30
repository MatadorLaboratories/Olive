import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * The OLIVE wordmark.
 *
 * Uses the supplied PNG logo at /public/logo.png. The asset is intrinsically
 * clay/orange — that reads well on both the cream canvas (Header) and the
 * dark olive ground (Footer / AdminShell), so we don't swap colours.
 *
 * Sizing: pass a Tailwind height (`h-7`, `h-8`, …) via `className`. The
 * width auto-scales to preserve the 245:74 aspect ratio.
 */
export function Wordmark({
  className,
  ariaLabel = "Olive Linen",
  priority = false,
}: {
  className?: string;
  /** Kept for compatibility with old call sites; the PNG is single-tone. */
  variant?: "duotone" | "mono";
  ariaLabel?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/logo.png"
      alt={ariaLabel}
      width={245}
      height={74}
      priority={priority}
      className={cn("inline-block w-auto", className)}
    />
  );
}
