import * as repo from "@/features/category-tree/repositories/category-node-repository";
import {
  buildTree,
  mapCategoryNode,
  type CategoryNode,
  type CategoryTreeNode,
} from "@/features/category-tree/types";
import { cached, invalidate } from "@/lib/cache/redis";
import { cacheKeys, cacheTtl } from "@/lib/cache/keys";
import type { NewCategoryNodeRow } from "@/lib/db/schema";

/** Public, cached tree — visible nodes only; hidden parents hide their subtree. */
export async function getVisibleTree(): Promise<CategoryTreeNode[]> {
  return cached(cacheKeys.categoryTree, cacheTtl.categories, async () => {
    const rows = await repo.findVisible();
    return buildTree(rows.map(mapCategoryNode), { dropOrphans: true });
  });
}

/** Full tree (including hidden) for the admin panel. */
export async function getTree(): Promise<CategoryTreeNode[]> {
  const rows = await repo.findAll();
  return buildTree(rows.map(mapCategoryNode));
}

/** Flat list of every node — used to populate the "parent" picker in admin. */
export async function getFlatNodes(): Promise<CategoryNode[]> {
  const rows = await repo.findAll();
  return rows.map(mapCategoryNode);
}

async function bust(): Promise<void> {
  await invalidate(cacheKeys.categoryTree);
}

export async function createNode(
  input: NewCategoryNodeRow,
): Promise<CategoryNode> {
  const row = await repo.create(input);
  await bust();
  return mapCategoryNode(row);
}

export async function updateNode(
  id: string,
  changes: Partial<NewCategoryNodeRow>,
): Promise<CategoryNode | null> {
  const row = await repo.update(id, changes);
  await bust();
  return row ? mapCategoryNode(row) : null;
}

export async function deleteNode(id: string): Promise<void> {
  await repo.remove(id);
  await bust();
}
