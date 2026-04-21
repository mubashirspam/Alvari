import Link from "next/link";
import { ProductForm } from "@/features/admin/components/product-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "New product · Kaasth admin" };

export default function NewProductPage() {
  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/products"
          className="mb-4 inline-block text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          ← Back to products
        </Link>
        <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
          New product
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Fill in the details below. After creating, you&apos;ll be taken to the edit page to add variants and images.
        </p>
      </div>
      <ProductForm />
    </div>
  );
}
