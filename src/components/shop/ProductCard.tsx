import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/types/domain";

export function ProductCard({ product }: { product: Product }) {
  const hasHire = typeof product.hirePriceCents === "number";
  const hasRetail = typeof product.retailPriceCents === "number";

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
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-cream-50">
          {product.kind === "retail" ? (
            <span className="pill !border-cream-50/40 !text-cream-50 backdrop-blur-sm">Shop</span>
          ) : product.kind === "hire" ? (
            <span className="pill !border-cream-50/40 !text-cream-50 backdrop-blur-sm">Hire</span>
          ) : (
            <span className="pill !border-cream-50/40 !text-cream-50 backdrop-blur-sm">Hire & Shop</span>
          )}
          <ArrowUpRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 opacity-0 group-hover:opacity-100"
            strokeWidth={1.5}
          />
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-xl text-olive-900 leading-tight">
            {product.name}
            {product.colour && <span className="text-olive-600"> — {product.colour}</span>}
          </h3>
          {product.fabric && (
            <p className="text-[12px] uppercase tracking-[0.12em] text-olive-500 mt-1 truncate">
              {product.fabric}
            </p>
          )}
        </div>
        <div className="text-right whitespace-nowrap shrink-0">
          {hasHire && (
            <p className="text-[12px] uppercase tracking-[0.12em] text-olive-700 tabular">
              Hire {formatMoney(product.hirePriceCents!)}
            </p>
          )}
          {hasRetail && (
            <p className="text-[12px] uppercase tracking-[0.12em] text-clay-600 tabular">
              Shop {formatMoney(product.retailPriceCents!)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
