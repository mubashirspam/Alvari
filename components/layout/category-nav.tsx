import Link from "next/link";
import { getVisibleCategories } from "@/features/categories/services/category-service";

const STATIC_LINKS = [
  { href: "/products?sort=new", label: "New Arrivals" },
] as const;

export async function CategoryNav() {
  const categories = await getVisibleCategories();

  return (
    <div className="border-y border-[var(--color-line)] bg-[var(--color-bg)]/85 backdrop-blur-xl">
      <nav className="mx-auto max-w-[1400px] px-4 md:px-6">
        <ul className="flex items-center gap-1 overflow-x-auto py-2 [scrollbar-width:none] md:justify-center md:gap-1 [&::-webkit-scrollbar]:hidden">
          {STATIC_LINKS.map((link) => (
            <li key={link.href} className="flex-shrink-0">
              <Link
                href={link.href}
                className="block whitespace-nowrap rounded-full px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/10 md:px-4 md:text-[13px]"
              >
                {link.label}
              </Link>
            </li>
          ))}
          {categories.map((c) => (
            <li key={c.category} className="flex-shrink-0">
              <Link
                href={`/products?category=${c.category}`}
                className="block whitespace-nowrap rounded-full px-3 py-1.5 text-[12.5px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-ink)]/5 hover:text-[var(--color-ink)] md:px-4 md:text-[13px]"
              >
                {c.label}
              </Link>
            </li>
          ))}
          <li className="flex-shrink-0">
            <Link
              href="/blog"
              className="block whitespace-nowrap rounded-full px-3 py-1.5 text-[12.5px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-ink)]/5 hover:text-[var(--color-ink)] md:px-4 md:text-[13px]"
            >
              Journal
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
