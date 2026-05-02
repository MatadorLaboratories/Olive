import Link from "next/link";
import Image from "next/image";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/types/domain";

/**
 * Editorial product card. Image, then a hairline-anchored caption row.
 * No floating overlay pills, no hover-arrow garnish — the underlying frame
 * has its own gentle hover scale.
 */
export function ProductCard({ product }: { product: Product }) {
  const hasHire = typeof product.hirePriceCents === "number";
  const hasRetail = typeof product.retailPriceCents === "number";
  const kindLabel =
    product.kind === "retail"
      ? "Shop"
      : product.kind === "hire"
        ? "Hire"
        : "Hire & Shop";

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <div className="frame aspect-[4/5] relative">
        {product.heroImageUrl ? (
          <Image
            src={product.heroImageUrl}
            alt={`${product.name} in ${product.colour ?? ""}`}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-cream-200 text-olive-500 font-display italic">
            {product.name}
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-[color:var(--border-hairline)]">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-[clamp(1.0625rem,1.4vw,1.25rem)] text-olive-900 leading-tight">
            {product.name}
            {product.colour && (
              <span className="text-olive-600"> — {product.colour}</span>
            )}
          </h3>
          <span className="text-[10px] uppercase tracking-[0.18em] text-olive-500 shrink-0 mt-1">
            {kindLabel}
          </span>
        </div>

        {product.fabric && (
          <p className="text-[12px] text-olive-600 mt-1.5 truncate leading-snug">
            {product.fabric}
          </p>
        )}

        <div className="mt-3 flex items-baseline justify-between gap-3 text-[11px] uppercase tracking-[0.14em]">
          {hasHire && (
            <p className="text-olive-700 tabular">
              Hire {formatMoney(product.hirePriceCents!)}
            </p>
          )}
          {hasRetail && (
            <p className="text-clay-600 tabular ml-auto">
              Shop {formatMoney(product.retailPriceCents!)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
