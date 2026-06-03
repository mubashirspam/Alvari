import { PackageCheck, ShieldCheck, Star, TreePine } from "lucide-react";

const ITEMS = [
  {
    Icon: Star,
    title: "4.8 / 5 Rated",
    subtitle: "Loved by 5,000+ families",
  },
  {
    Icon: PackageCheck,
    title: "10,000+ Delivered",
    subtitle: "Pieces in Kerala homes",
  },
  {
    Icon: TreePine,
    title: "Premium Solid Wood",
    subtitle: "Furniture-grade timber",
  },
  {
    Icon: ShieldCheck,
    title: "Up to 10-Year Warranty",
    subtitle: "On every handcrafted piece",
  },
] as const;

export function TrustStrip() {
  return (
    <section className="border-y border-[var(--color-line)] bg-[var(--color-bg)]">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 divide-x divide-y divide-[var(--color-line)] md:grid-cols-4 md:divide-y-0">
        {ITEMS.map(({ Icon, title, subtitle }) => (
          <div
            key={title}
            className="flex flex-col items-center justify-center gap-2 px-4 py-7 text-center md:py-9"
          >
            <Icon className="h-6 w-6 text-[var(--color-ink)]" strokeWidth={1.4} />
            <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--color-ink)] md:text-[13px]">
              {title}
            </p>
            <p className="text-[12px] text-[var(--color-muted)]">{subtitle}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
