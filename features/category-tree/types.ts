import type { CategoryNodeRow, ProductRow } from "@/lib/db/schema";

export type ProductCategoryValue = ProductRow["category"];

export type CategoryNode = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  imageKey: string | null;
  accentColor: string | null;
  linkCategory: ProductCategoryValue | null;
  material: string | null;
  linkHref: string | null;
  sortOrder: number;
  isVisible: boolean;
};

export type CategoryTreeNode = CategoryNode & { children: CategoryTreeNode[] };

export function mapCategoryNode(row: CategoryNodeRow): CategoryNode {
  return {
    id: row.id,
    parentId: row.parentId,
    name: row.name,
    slug: row.slug,
    imageKey: row.imageKey,
    accentColor: row.accentColor,
    linkCategory: row.linkCategory,
    material: row.material,
    linkHref: row.linkHref,
    sortOrder: row.sortOrder,
    isVisible: row.isVisible,
  };
}

/**
 * Assemble a flat, pre-sorted list of nodes into a nested tree. Children keep
 * the incoming order (the repository sorts by sortOrder then name).
 *
 * When `dropOrphans` is true, a node whose `parentId` is not in the set is
 * discarded (along with its subtree) instead of being promoted to a root. Used
 * for the public tree so that hiding a parent hides everything beneath it.
 */
export function buildTree(
  nodes: CategoryNode[],
  { dropOrphans = false }: { dropOrphans?: boolean } = {},
): CategoryTreeNode[] {
  const byId = new Map<string, CategoryTreeNode>();
  for (const node of nodes) byId.set(node.id, { ...node, children: [] });

  const roots: CategoryTreeNode[] = [];
  for (const node of byId.values()) {
    if (!node.parentId) {
      roots.push(node);
      continue;
    }
    const parent = byId.get(node.parentId);
    if (parent) parent.children.push(node);
    else if (!dropOrphans) roots.push(node);
  }
  return roots;
}

/**
 * Resolve where a category node points: an explicit href wins, otherwise build a
 * product-listing URL from the linked category (+ optional material facet).
 * Returns null when the node is purely a drill-down container.
 */
export function categoryNodeHref(node: CategoryNode): string | null {
  if (node.linkHref && node.linkHref.trim()) return node.linkHref.trim();
  if (node.linkCategory) {
    const params = new URLSearchParams({ category: node.linkCategory });
    if (node.material && node.material.trim()) {
      params.set("material", node.material.trim());
    }
    return `/products?${params.toString()}`;
  }
  return null;
}
