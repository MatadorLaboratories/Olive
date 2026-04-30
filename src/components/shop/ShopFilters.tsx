"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/cn";

export type ShopFilterOptions = {
  categories: string[];
  colours: string[];
};

/**
 * Editorial filter rail — categories on the left, colours below, with
 * URL-driven state so filters survive deep links and back-button.
 */
export function ShopFilters({
  categories,
  colours,
  active,
}: {
  categories: string[];
  colours: string[];
  active: { kind?: string; category?: string; colour?: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const toggle = (key: string, value: string) => {
    const next = new URLSearchParams(params?.toString());
    if (next.get(key) === value) next.delete(key);
    else next.set(key, value);
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    });
  };

  const clearAll = () => {
    startTransition(() => router.push(pathname ?? "/shop", { scroll: false }));
  };

  const Pill = ({
    label,
    active: isActive,
    onClick,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "pill cursor-pointer transition-colors",
        isActive
          ? "!bg-olive-900 !text-cream-50 !border-olive-900"
          : "hover:border-olive-700 hover:text-olive-900",
      )}
    >
      {label}
    </button>
  );

  const hasFilters = active.kind || active.category || active.colour;

  return (
    <div className="space-y-8">
      {/* Kind */}
      <div>
        <p className="eyebrow text-olive-600 mb-3">Browse</p>
        <div className="flex flex-wrap gap-2">
          <Pill label="All" active={!active.kind} onClick={() => toggle("kind", active.kind ?? "")} />
          <Pill label="Hire" active={active.kind === "hire"} onClick={() => toggle("kind", "hire")} />
          <Pill label="Shop" active={active.kind === "retail"} onClick={() => toggle("kind", "retail")} />
        </div>
      </div>

      {/* Category */}
      {categories.length > 0 && (
        <div>
          <p className="eyebrow text-olive-600 mb-3">Category</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Pill key={c} label={prettify(c)} active={active.category === c} onClick={() => toggle("category", c)} />
            ))}
          </div>
        </div>
      )}

      {/* Colour */}
      {colours.length > 0 && (
        <div>
          <p className="eyebrow text-olive-600 mb-3">Colour</p>
          <div className="flex flex-wrap gap-2">
            {colours.map((c) => (
              <Pill key={c} label={c} active={active.colour === c} onClick={() => toggle("colour", c)} />
            ))}
          </div>
        </div>
      )}

      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="text-[12px] uppercase tracking-[0.12em] text-olive-700 hover:text-clay-500 transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

function prettify(s: string) {
  return s.replace(/^./, (c) => c.toUpperCase());
}
