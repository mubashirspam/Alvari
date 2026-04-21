import { ScrollReveal } from "@/components/layout/scroll-reveal";

const cards = [
  {
    roman: "i",
    title: "Factory pricing, no markup",
    body: "What you pay is what the piece costs to build — plus fair margin for our craftsmen. That's it.",
  },
  {
    roman: "ii",
    title: "Made to your measurements",
    body: "We visit your home, measure the exact space, confirm wood and finish. Every piece is built for your room.",
  },
  {
    roman: "iii",
    title: "Real wood, real hands",
    body: "Sheesham, teak, mahogany. Our carpenters have been at this for decades. Joinery you won't find in flat-pack.",
  },
];

export function WhySection() {
  return (
    <section id="about" className="py-30">
      <div className="mx-auto max-w-[1200px] px-6 md:px-12">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <ScrollReveal>
            <div className="mb-5 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Why Alvari
            </div>
            <h2 className="font-serif text-[clamp(40px,5vw,64px)] leading-[1.05] tracking-[-0.03em] text-[var(--color-ink)]">
              We&apos;re the workshop
              <br />
              that{" "}
              <em className="italic text-[var(--color-accent)]">supplies</em>
              <br />
              the showrooms.
            </h2>
            <p className="mt-6 text-base font-light leading-[1.75] text-[var(--color-muted)]">
              Now selling direct to you. Skip the markup, get the same quality
              — or better — at factory price. Typically 35–45% less than what
              you&apos;d pay at any showroom.
            </p>
          </ScrollReveal>

          <div className="flex flex-col">
            {cards.map((card, idx) => (
              <ScrollReveal
                key={card.roman}
                delay={((idx + 1) as 1 | 2 | 3)}
                className="group grid grid-cols-[48px_1fr] items-start gap-5 border-b border-[var(--color-line)] py-7 first:border-t"
              >
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-line)] font-serif text-[15px] italic text-[var(--color-muted)] transition-all duration-300 group-hover:border-[var(--color-accent)] group-hover:bg-[var(--color-accent)] group-hover:text-[var(--color-bg)]">
                  {card.roman}
                </div>
                <div>
                  <h4 className="mb-1.5 font-serif text-xl text-[var(--color-ink)]">
                    {card.title}
                  </h4>
                  <p className="text-[14px] font-light leading-[1.6] text-[var(--color-muted)]">
                    {card.body}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
