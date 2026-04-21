import Link from "next/link";
import { ArrowUpRight, MessageCircle, Phone } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { siteConfig } from "@/lib/env";

type IconProps = SVGProps<SVGSVGElement>;

function InstagramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function YoutubeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" {...props}>
      <path d="M22 8.5a4 4 0 0 0-2.8-2.8C17.4 5.2 12 5.2 12 5.2s-5.4 0-7.2.5A4 4 0 0 0 2 8.5 42 42 0 0 0 1.5 12 42 42 0 0 0 2 15.5a4 4 0 0 0 2.8 2.8c1.8.5 7.2.5 7.2.5s5.4 0 7.2-.5A4 4 0 0 0 22 15.5 42 42 0 0 0 22.5 12 42 42 0 0 0 22 8.5Z" />
      <path d="M10 15V9l5 3-5 3Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

const quickLinks = [
  { href: "/products", label: "Products" },
  { href: "/#process", label: "Process" },
  { href: "/#contact", label: "Factory Visit" },
  { href: "/#contact", label: "Custom Orders" },
];

const socials: {
  href: string;
  label: string;
  Icon: ComponentType<IconProps>;
}[] = [
  { href: "https://instagram.com/", label: "Instagram", Icon: InstagramIcon },
  { href: "https://facebook.com/", label: "Facebook", Icon: FacebookIcon },
  { href: "https://youtube.com/", label: "YouTube", Icon: YoutubeIcon },
  {
    href: `https://wa.me/${siteConfig.whatsappNumber}`,
    label: "WhatsApp",
    Icon: MessageCircle as ComponentType<IconProps>,
  },
  {
    href: `tel:+${siteConfig.whatsappNumber}`,
    label: "Call",
    Icon: Phone as ComponentType<IconProps>,
  },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-[var(--color-ink)] text-[var(--color-bg)]">
      <div className="mx-auto max-w-[1200px] px-6 pt-16 pb-[clamp(140px,22vw,260px)] md:px-12">
        <div className="grid gap-10 rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-10 lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col justify-between gap-6">
            <div>
              <Link href="/" className="inline-flex items-baseline gap-1">
                <span className="font-serif text-[22px] leading-none">
                  &copy; Alvari 26
                </span>
              </Link>
              <p className="mt-4 max-w-[320px] text-[14px] leading-[1.6] text-[var(--color-bg)]/60">
                Factory-direct furniture from our Wayanad workshop — wardrobes,
                beds, sofa setti and complete room sets, priced without
                middlemen.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-[14px] font-medium transition-colors hover:border-white/25 hover:bg-white/[0.06]"
              >
                {link.label}
                <ArrowUpRight
                  className="h-4 w-4 text-[var(--color-bg)]/60 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-accent-warm)]"
                  strokeWidth={1.5}
                />
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:grid-cols-[1.1fr_1fr] md:p-8">
          <div className="flex flex-col gap-2">
            <span className="text-[12px] tracking-[0.18em] uppercase text-[var(--color-bg)]/40">
              Contact us
            </span>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <a
                href="mailto:hello@alvari.in"
                className="text-[15px] text-[var(--color-bg)] transition-colors hover:text-[var(--color-accent-warm)]"
              >
                hello@alvari.in
              </a>
              <span
                aria-hidden
                className="hidden h-1 w-1 rounded-full bg-[var(--color-bg)]/30 md:block"
              />
              <span className="inline-flex items-center gap-2 text-[14px] text-[var(--color-bg)]/65">
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                Bedroom / Living / Dining
              </span>
            </div>
          </div>

          <ul className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
            {socials.map(({ href, label, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={label}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[var(--color-bg)]/80 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.08] hover:text-[var(--color-accent-warm)]"
                >
                  <Icon className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-2 text-[12px] text-[var(--color-bg)]/40 md:flex-row">
          <span>© 2026 Alvari Furniture · Wayanad, Kerala</span>
          <span>
            Built with{" "}
            <em className="not-italic italic text-[var(--color-accent-warm)]">
              care
            </em>
            , not shortcuts.
          </span>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center overflow-hidden"
      >
        <span className="translate-y-[22%] whitespace-nowrap font-serif text-[clamp(100px,22vw,280px)] leading-none tracking-[-0.04em] text-[var(--color-bg)]/[0.07] select-none">
          Alvari Furniture
        </span>
      </div>
    </footer>
  );
}
