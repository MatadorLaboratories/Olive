"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/cn";

/**
 * Editorial filter rail — hairline-divided groups, small rectangular tags.
 * URL-driven state so filters survive deep links and the back button.
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

  const Tag = ({
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
        "h-7 px-3 rounded-sm border text-[11px] uppercase tracking-[0.12em] transition-colors",
        isActive
          ? "bg-olive-900 border-olive-900 text-cream-50"
          : "border-[color:var(--border-base)] text-olive-800 hover:border-olive-700 hover:text-olive-900",
      )}
    >
      {label}
    </button>
  );

  const hasFilters = active.kind || active.category || active.colour;

  return (
    <div>
      <Group label="Browse">
        <div className="flex flex-wrap gap-1.5">
          <Tag
            label="All"
            active={!active.kind}
            onClick={() => toggle("kind", active.kind ?? "")}
          />
          <Tag
            label="Hire"
            active={active.kind === "hire"}
            onClick={() => toggle("kind", "hire")}
          />
          <Tag
            label="Shop"
            active={active.kind === "retail"}
            onClick={() => toggle("kind", "retail")}
          />
        </div>
      </Group>

      {categories.length > 0 && (
        <Group label="Category">
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <Tag
                key={c}
                label={prettify(c)}
                active={active.category === c}
                onClick={() => toggle("category", c)}
              />
            ))}
          </div>
        </Group>
      )}

      {colours.length > 0 && (
        <Group label="Colour">
          <div className="flex flex-wrap gap-1.5">
            {colours.map((c) => (
              <Tag
                key={c}
                label={c}
                active={active.colour === c}
                onClick={() => toggle("colour", c)}
              />
            ))}
          </div>
        </Group>
      )}

      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="mt-7 inline-flex items-baseline gap-3 text-[11px] uppercase tracking-[0.16em] text-olive-700 hover:text-clay-600 transition-colors"
        >
          <span className="inline-block w-6 h-px bg-current" />
          Clear filters
        </button>
      )}
    </div>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-6 first:pt-0 border-t border-[color:var(--border-hairline)] first:border-t-0">
      <p className="eyebrow text-olive-600 mb-3">{label}</p>
      {children}
    </section>
  );
}

function prettify(s: string) {
  return s.replace(/^./, (c) => c.toUpperCase());
}
