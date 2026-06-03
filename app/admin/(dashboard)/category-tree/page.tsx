import { getTree } from "@/features/category-tree/services/category-tree-service";
import { CategoryTreeManager } from "@/features/admin/components/category-tree-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Category Tree · Alvari" };

export default async function AdminCategoryTreePage() {
  const tree = await getTree();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
          Category Tree
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--color-muted)]">
          Build the navigation hierarchy shown on the homepage — e.g. Furniture →
          Solid Wood → Almirah. Add, edit, reorder, or delete nodes at any level.
          A node with children acts as a drill-down; give a node a linked category
          (and optional material) or a custom URL to make it open a product
          listing. Deleting a node also deletes everything beneath it.
        </p>
      </div>

      <CategoryTreeManager initialTree={tree} />
    </div>
  );
}
