import { MapPin, MessageCircle, Phone } from "lucide-react";
import { ScrollReveal } from "@/components/layout/scroll-reveal";
import { EnquiryForm } from "@/features/enquiries/components/enquiry-form";
import { siteConfig } from "@/lib/env";

export function EnquiryCtaSection() {
  const contacts = [
    {
      href: `https://wa.me/${siteConfig.whatsappNumber}`,
      icon: <MessageCircle className="h-[18px] w-[18px] shrink-0 text-[var(--color-accent)]" />,
      label: "WhatsApp Us",
      detail: siteConfig.displayNumber,
      asLink: true,
    },
    {
      href: `tel:+${siteConfig.whatsappNumber}`,
      icon: <Phone className="h-[18px] w-[18px] shrink-0 text-[var(--color-accent)]" />,
      label: "Call Direct",
      detail: siteConfig.hours,
      asLink: true,
    },
    {
      icon: <MapPin className="h-[18px] w-[18px] shrink-0 text-[var(--color-accent)]" />,
      label: "Visit Factory",
      detail: siteConfig.location,
      asLink: false,
    },
  ];

  return (
    <section id="contact" className="bg-[var(--color-bg)] py-30">
      <div className="mx-auto max-w-[1200px] px-6 md:px-12">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
          <ScrollReveal>
            <h2 className="font-serif text-[clamp(40px,5vw,64px)] leading-[1.05] tracking-[-0.03em] text-[var(--color-ink)]">
              Ready to order
              <br />
              your{" "}
              <em className="italic text-[var(--color-accent)]">first piece?</em>
            </h2>
            <p className="mt-5 max-w-[420px] text-base font-light leading-[1.75] text-[var(--color-muted)]">
              No online payment. No pushy sales. Send an enquiry — we&apos;ll
              call, quote, and build you something that lasts a lifetime.
            </p>

            <div className="mt-9 flex flex-col gap-3.5">
              {contacts.map((contact, idx) => {
                const content = (
                  <>
                    {contact.icon}
                    <div>
                      <strong className="block text-[15px] font-medium text-[var(--color-ink)]">
                        {contact.label}
                      </strong>
                      <span className="text-[13px] text-[var(--color-muted)]">
                        {contact.detail}
                      </span>
                    </div>
                  </>
                );
                const className =
                  "group flex items-center gap-4 rounded-full border border-[var(--color-line)] px-6 py-4 text-sm transition-all duration-300 hover:translate-x-1.5 hover:border-[var(--color-accent)]";
                return contact.asLink && contact.href ? (
                  <a
                    key={idx}
                    href={contact.href}
                    className={className}
                  >
                    {content}
                  </a>
                ) : (
                  <div key={idx} className={className}>
                    {content}
                  </div>
                );
              })}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={2}>
            <EnquiryForm />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
