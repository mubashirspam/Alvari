import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getFeaturedCollectionsWithProducts } from "@/features/collections/services/collection-service";
import { buildImageKitUrl } from "@/lib/imagekit";

export async function FeaturedCollections() {
  const collections = await getFeaturedCollectionsWithProducts();
  if (collections.length === 0) return null;

  return (
    <section className="bg-[var(--color-bg)] py-14 md:py-20">
      <div className="mx-auto max-w-[1400px] px-6 md:px-12">
        <div className="mb-8 md:mb-12">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--color-accent)]">
            Curated collections
          </p>
          <h2 className="font-serif text-[clamp(28px,4vw,44px)] leading-[1.1] tracking-[-0.02em] text-[var(--color-ink)]">
            Explore by mood
          </h2>
        </div>

        <div className="space-y-12 md:space-y-16">
          {collections.map((collection) => {
            const heroImage = collection.heroImageKey
              ? buildImageKitUrl(collection.heroImageKey, {
                  width: 1600,
                  quality: 85,
                  format: "auto",
                })
              : null;
            const tileProducts = collection.products.slice(0, 3);

            return (
              <div
                key={collection.id}
                className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5"
              >
                <Link
                  href={`/collections/${collection.slug}`}
                  className="group relative aspect-[4/5] overflow-hidden rounded-[18px] md:col-span-7 md:aspect-auto md:min-h-[480px]"
                  style={{
                    background: collection.accentColor ?? "#14223e",
                  }}
                >
                  {heroImage ? (
                    <Image
                      src={heroImage}
                      alt={collection.title}
                      fill
                      sizes="(min-width: 768px) 60vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end p-6 text-white md:p-10">
                    {collection.subtitle ? (
                      <p className="text-[11px] font-medium uppercase tracking-[0.22em] opacity-85">
                        {collection.subtitle}
                      </p>
                    ) : null}
                    <h3 className="mt-3 font-serif text-[clamp(36px,6vw,72px)] leading-[0.95] tracking-[-0.02em]">
                      {collection.title}
                    </h3>
                    <span className="mt-5 inline-flex items-center gap-2 text-[13px] uppercase tracking-[0.12em]">
                      Explore <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>

                <div className="grid grid-cols-2 gap-4 md:col-span-5 md:grid-cols-1 md:gap-5">
                  {tileProducts.length > 0
                    ? tileProducts.slice(0, 3).map((p) => {
                        const tileImg = p.imageUrl
                          ? buildImageKitUrl(p.imageUrl, {
                              width: 800,
                              quality: 80,
                              format: "auto",
                            })
                          : null;
                        return (
                          <Link
                            key={p.id}
                            href={`/products/${p.slug}`}
                            className="group relative aspect-[4/3] overflow-hidden rounded-[14px] md:aspect-[5/3]"
                            style={{
                              background: `linear-gradient(145deg, ${p.gradientFrom}, ${p.gradientTo})`,
                            }}
                          >
                            {tileImg ? (
                              <Image
                                src={tileImg}
                                alt={p.name}
                                fill
                                sizes="(min-width: 768px) 28vw, 45vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : null}
                            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 text-white">
                              <span className="text-[13px] font-medium">
                                {p.name.split(" ").slice(0, 3).join(" ")}
                              </span>
                              <ArrowRight className="h-4 w-4" />
                            </div>
                          </Link>
                        );
                      })
                    : null}
                  {tileProducts.length < 3
                    ? Array.from({ length: 3 - tileProducts.length }).map(
                        (_, i) => (
                          <div
                            key={`empty-${i}`}
                            className="aspect-[5/3] rounded-[14px] bg-[var(--color-bg-soft)]"
                          />
                        ),
                      )
                    : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
