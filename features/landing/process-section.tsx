import { ScrollReveal } from "@/components/layout/scroll-reveal";

const steps = [
  {
    roman: "i",
    title: "Enquire",
    body: "Send a WhatsApp or fill the form. No payment, no commitment.",
  },
  {
    roman: "ii",
    title: "We Call You",
    body: "Within 2 hours we call back, answer your questions, and send a clear quote.",
  },
  {
    roman: "iii",
    title: "Measurement Visit",
    body: "For custom pieces, our team visits your home and confirms every detail.",
  },
  {
    roman: "iv",
    title: "Delivered",
    body: "Built in Wayanad, delivered and installed across Kerala. Pay on delivery.",
  },
];

export function ProcessSection() {
  return (
    <section id="process" className="py-30">
      <div className="mx-auto max-w-[1200px] px-6 md:px-12">
        <ScrollReveal className="mb-20 text-center">
          <h2 className="font-serif text-[clamp(36px,5vw,64px)] font-normal tracking-[-0.03em] text-[var(--color-ink)]">
            From enquiry to{" "}
            <em className="italic text-[var(--color-accent)]">delivery,</em>
            <br />
            simple.
          </h2>
          <p className="mx-auto mt-4 max-w-[480px] text-base font-light leading-[1.7] text-[var(--color-muted)]">
            No online payment, no rush. You enquire, we call you back, and we
            build your furniture the right way.
          </p>
        </ScrollReveal>

        <div className="relative grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[12%] right-[12%] top-9 hidden h-px bg-[var(--color-line)] lg:block"
          />
          {steps.map((step, idx) => (
            <ScrollReveal
              key={step.roman}
              delay={((idx + 1) as 1 | 2 | 3 | 4)}
              className="group relative z-10 px-4 text-center"
            >
              <div className="mx-auto mb-6 flex h-18 w-18 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-bg)] font-serif text-[28px] italic text-[var(--color-ink)] transition-all duration-300 group-hover:border-[var(--color-ink)] group-hover:bg-[var(--color-ink)] group-hover:text-[var(--color-bg)]">
                {step.roman}
              </div>
              <h4 className="mb-2 font-serif text-[19px] text-[var(--color-ink)]">
                {step.title}
              </h4>
              <p className="text-[13px] font-light leading-[1.6] text-[var(--color-muted)]">
                {step.body}
              </p>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
