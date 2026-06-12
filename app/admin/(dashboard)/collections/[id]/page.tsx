import { notFound } from "next/navigation";
import { BreadcrumbLabel } from "@/features/admin/components/admin-breadcrumbs";
import { CollectionForm } from "@/features/admin/components/collection-form";
import { CollectionProductsPicker } from "@/features/admin/components/collection-products-picker";
import { getCollectionById } from "@/features/collections/services/collection-service";
import { getAllProducts } from "@/features/products/services/product-service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit collection · Alvari admin" };

type Params = Promise<{ id: string }>;

export default async function EditCollectionPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const [collection, allProducts] = await Promise.all([
    getCollectionById(id),
    getAllProducts(),
  ]);
  if (!collection) notFound();

  const lightProducts = allProducts.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    imageUrl: p.imageUrl,
  }));

  return (
    <div className="space-y-10">
      <BreadcrumbLabel segment={id} label={collection.title} />
      <div>
        <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
          {collection.title}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">/{collection.slug}</p>
      </div>

      <section>
        <h2 className="mb-4 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-muted)]">
          Details
        </h2>
        <CollectionForm collection={collection} />
      </section>

      <section>
        <h2 className="mb-4 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-muted)]">
          Products in this collection
        </h2>
        <CollectionProductsPicker
          collectionId={collection.id}
          allProducts={lightProducts}
          initialSelectedIds={collection.products.map((p) => p.id)}
        />
      </section>
    </div>
  );
}
