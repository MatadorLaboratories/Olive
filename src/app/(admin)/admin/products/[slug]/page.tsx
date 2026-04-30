import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { getProductBySlug } from "@/services/catalogue";

type Params = { slug: string };

export default async function AdminProductEditor({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const isNew = slug === "new";
  const product = isNew ? null : await getProductBySlug(slug);
  if (!isNew && !product) notFound();

  return (
    <div className="space-y-10 max-w-7xl">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-olive-700 hover:text-clay-500 transition-colors"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
        All products
      </Link>

      <PageHeader
        eyebrow={isNew ? "New product" : `Editing ${product?.slug}`}
        title={
          isNew
            ? <>New <span className="italic font-light">product.</span></>
            : <>{product?.name}<span className="block italic font-light text-olive-700/85 text-[0.7em] mt-1">{product?.colour ?? ""}</span></>
        }
      />

      <ProductForm initial={product ?? null} />
    </div>
  );
}
