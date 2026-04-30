import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export function StatCard({
  label,
  value,
  delta,
  href,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  delta?: string;
  href?: string;
  icon?: LucideIcon;
  tone?: "default" | "warning";
}) {
  const Wrapper = href ? Link : "div";
  return (
    <Wrapper
      // @ts-expect-error - polymorphic href on conditional element
      href={href}
      className={`card p-6 group transition-colors hover:border-olive-300 ${tone === "warning" ? "border-clay-300/40 bg-clay-50/40" : ""}`}
    >
      <div className="flex items-start justify-between">
        <p className="eyebrow text-olive-600">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-olive-500" strokeWidth={1.5} />}
      </div>
      <p className="mt-5 font-display text-3xl text-olive-900 tabular leading-none">{value}</p>
      {delta && <p className="mt-3 text-xs text-olive-500">{delta}</p>}
    </Wrapper>
  );
}
