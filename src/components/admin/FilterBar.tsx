"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

export function FilterBar({
  status,
  statusOptions,
  sort,
  sortOptions,
  search,
}: {
  status?: string;
  statusOptions?: { value: string; label: string }[];
  sort?: string;
  sortOptions?: { value: string; label: string }[];
  search?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params?.toString());
    if (value) next.set(key, value); else next.delete(key);
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Search */}
      <div className="relative w-full sm:max-w-xs">
        <Search className="h-3.5 w-3.5 text-olive-500 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
        <input
          type="search"
          defaultValue={search ?? ""}
          placeholder="Search ref, client, venue…"
          onChange={(e) => update("q", e.target.value)}
          className="field-input !pl-9 !py-2.5 !text-sm"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {statusOptions && (
          <Pills
            label="Status"
            current={status ?? "all"}
            options={[{ value: "all", label: "All" }, ...statusOptions]}
            onChange={(v) => update("status", v === "all" ? "" : v)}
          />
        )}
        {sortOptions && (
          <select
            value={sort ?? sortOptions[0]?.value}
            onChange={(e) => update("sort", e.target.value)}
            className="field-select !py-2.5 !pr-8 !text-sm w-auto"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>Sort: {o.label}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

function Pills({
  label,
  current,
  options,
  onChange,
}: {
  label: string;
  current: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="sr-only">{label}</span>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "px-3 py-1.5 rounded-full text-[11px] uppercase tracking-[0.12em] border transition-colors",
            current === o.value
              ? "bg-olive-900 text-cream-50 border-olive-900"
              : "border-[color:var(--color-rule)] text-olive-700 hover:border-olive-700",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
