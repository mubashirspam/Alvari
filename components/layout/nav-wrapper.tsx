import { getVisibleTree } from "@/features/category-tree/services/category-tree-service";
import { SiteNav } from "@/components/layout/site-nav";

export async function NavWrapper({
  variant = "standalone",
}: {
  variant?: "standalone" | "clubbed";
}) {
  const tree = await getVisibleTree();
  return <SiteNav variant={variant} categoryTree={tree} />;
}
