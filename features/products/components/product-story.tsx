import Image from "next/image";
import type { Product, ProductBlogSection } from "@/features/products/types";
import { buildImageKitUrl } from "@/lib/imagekit";
import { renderMarkdown } from "@/lib/markdown";

export function ProductLongDescription({ product }: { product: Product }) {
  if (!product.longDescription) return null;
  return (
    <section className="mt-20 border-t border-[var(--color-line)] pt-16">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
        From the manufacturer
      </p>
      <h2 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
        Why this {product.name.toLowerCase()} lasts
      </h2>
      <div
        className="max-w-[720px]"
        dangerouslySetInnerHTML={{
          __html: renderMarkdown(product.longDescription),
        }}
      />
    </section>
  );
}

export function ProductBlogSections({
  sections,
}: {
  sections: ProductBlogSection[];
}) {
  if (sections.length === 0) return null;
  return (
    <section className="mt-20 border-t border-[var(--color-line)] pt-16">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
        The stories behind this piece
      </p>
      <h2 className="mb-12 font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
        From the Alvari journal
      </h2>

      <div className="space-y-16">
        {sections.map((section) => (
          <article key={section.id} className="grid gap-10 md:grid-cols-[1fr_1.2fr]">
            {section.coverImageKey ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image
                  src={buildImageKitUrl(section.coverImageKey, {
                    width: 900,
                    quality: 75,
                    format: "auto",
                  })}
                  alt={section.title}
                  fill
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-[#8B5E3C] to-[#3E2818]" />
            )}

            <div>
              <h3 className="font-serif text-[28px] leading-tight tracking-[-0.02em] text-[var(--color-ink)]">
                {section.title}
              </h3>
              <p className="mt-3 text-[12px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
                {section.authorName} · {section.readingMinutes} min read
              </p>
              {section.excerpt && (
                <p className="mt-5 text-[15px] font-light italic text-[var(--color-muted)]">
                  {section.excerpt}
                </p>
              )}
              <div
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(section.contentMarkdown),
                }}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
