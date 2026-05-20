import { Banknote, Truck, ShieldCheck } from "lucide-react";

const ITEMS = [
  { Icon: Banknote, label: "No-cost EMI with leading banks" },
  { Icon: Truck, label: "Free delivery & installation across Kerala" },
  { Icon: ShieldCheck, label: "Factory-direct prices · 7-day returns" },
] as const;

export function TrustStrip() {
  return (
    <section className="border-y border-[var(--color-line)] bg-[var(--color-bg)]">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 divide-y divide-[var(--color-line)] md:grid-cols-3 md:divide-x md:divide-y-0">
        {ITEMS.map(({ Icon, label }) => (
          <div
            key={label}
            className="flex items-center justify-center gap-3 px-6 py-4 text-[13px] text-[var(--color-ink)] md:py-5 md:text-[14px]"
          >
            <Icon className="h-4 w-4 text-[var(--color-accent)]" />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
