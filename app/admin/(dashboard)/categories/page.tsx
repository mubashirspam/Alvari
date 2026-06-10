import { CategoryRowForm } from "@/features/admin/components/category-row-form";
import { CsvImportDialog } from "@/features/admin/components/csv-import-dialog";
import { getAllCategories } from "@/features/categories/services/category-service";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getAllCategories();

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
            Categories
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Edit the image, label, slug, and visibility of each category. Adding a new category requires a code migration (categories are tied to the product enum).
          </p>
        </div>
        <CsvImportDialog entity="categories" />
      </div>

      <div className="space-y-3">
        {categories.map((c) => (
          <CategoryRowForm key={c.category} category={c} />
        ))}
      </div>
    </div>
  );
}
