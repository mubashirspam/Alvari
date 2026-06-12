import { VariantAttributesManager } from "@/features/admin/components/variant-attributes-manager";
import { findAllAttributeDefs } from "@/features/variant-attributes/repositories/variant-attribute-repository";

export const dynamic = "force-dynamic";
export const metadata = { title: "Variant attributes · Alvari admin" };

export default async function VariantAttributesPage() {
  const defs = await findAllAttributeDefs();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
          Variant attributes
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Define which options each category&apos;s variants offer — e.g. Doors for
          almirahs, Size and Material for beds. The variant manager and the product
          page pickers are generated from these.
        </p>
      </div>
      <VariantAttributesManager initialDefs={defs} />
    </div>
  );
}
