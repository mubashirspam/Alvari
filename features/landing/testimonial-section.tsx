import { ScrollReveal } from "@/components/layout/scroll-reveal";

type Customer = {
  initials: string;
  name: string;
  role: string;
  tint: string;
};

const customers: Customer[] = [
  {
    initials: "SH",
    name: "Sajid Hussain",
    role: "Retail owner, Kochi",
    tint: "bg-[#e8c468]",
  },
  {
    initials: "PN",
    name: "Priya Nair",
    role: "Homemaker, Thrissur",
    tint: "bg-[#d98d5e]",
  },
  {
    initials: "MT",
    name: "Meera Thomas",
    role: "Architect, Ernakulam",
    tint: "bg-[#8b4513]",
  },
  {
    initials: "JK",
    name: "Jacob Kurien",
    role: "Hotelier, Kumarakom",
    tint: "bg-[#4a6b4a]",
  },
];

export function TestimonialSection() {
  return (
    <section className="bg-[var(--color-bg)] py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-6 md:px-12">
        <ScrollReveal className="mb-14 flex flex-col items-center text-center">
          <span className="rounded-full border border-[var(--color-line)] px-5 py-1.5 text-[11px] font-medium tracking-[0.22em] uppercase text-[var(--color-muted)]">
            Testimonials
          </span>
          <h2 className="mt-6 font-serif text-[clamp(36px,5vw,58px)] leading-[1.1] tracking-[-0.02em] text-[var(--color-ink)]">
            What our customers said
          </h2>
        </ScrollReveal>

        <div className="grid items-stretch gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
          <ScrollReveal className="flex flex-col gap-4">
            {customers.map((customer) => (
              <div
                key={customer.name}
                className="flex items-center gap-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)]/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-bg-soft)]"
              >
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl font-serif text-lg text-[var(--color-bg)] ${customer.tint}`}
                >
                  {customer.initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium text-[var(--color-ink)]">
                    {customer.name}
                  </p>
                  <p className="truncate text-[13px] text-[var(--color-muted)]">
                    {customer.role}
                  </p>
                </div>
              </div>
            ))}
          </ScrollReveal>

          <ScrollReveal
            delay={2}
            className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[var(--color-bg-soft)] p-8 md:p-12 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-10"
          >
            <div className="relative hidden aspect-[3/4] overflow-hidden rounded-xl bg-gradient-to-br from-[#8b4513] via-[#6b3410] to-[#2a1a10] lg:block">
              <div
                aria-hidden
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 30% 20%, rgba(217,141,94,0.6), transparent 55%), radial-gradient(circle at 70% 80%, rgba(245,239,230,0.35), transparent 50%)",
                }}
              />
              <span className="absolute bottom-5 left-5 font-serif text-[64px] leading-none text-[var(--color-bg)]/90">
                BJ
              </span>
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <span
                  aria-hidden
                  className="block font-serif text-[90px] leading-none text-[var(--color-accent-warm)]"
                >
                  &ldquo;
                </span>
                <p className="-mt-6 font-serif text-[clamp(20px,2.2vw,26px)] leading-[1.4] tracking-[-0.01em] text-[var(--color-ink)]">
                  Excellent experience with Alvari. They measured our bedroom,
                  suggested the right teak, and delivered a full room set in
                  three weeks. Honest price, honest work.
                </p>
              </div>
              <div className="mt-8 border-t border-[var(--color-line)] pt-5">
                <p className="font-serif text-lg text-[var(--color-ink)]">
                  Beena Joseph
                </p>
                <p className="text-[13px] text-[var(--color-muted)]">
                  Homeowner, Kalpetta
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
