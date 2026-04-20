import Link from "next/link";

const columns = [
  {
    title: "Shop",
    links: [
      { href: "/products?category=almirah", label: "Almirahs" },
      { href: "/products?category=bed", label: "Beds" },
      { href: "/products?category=sofa", label: "Sofa Setti" },
      { href: "/products?category=dining", label: "Dining Sets" },
      { href: "/products?category=room_set", label: "Room Sets" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/#about", label: "Our Story" },
      { href: "/#process", label: "How it Works" },
      { href: "/#contact", label: "Factory Visit" },
      { href: "/#contact", label: "Contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/#contact", label: "WhatsApp Chat" },
      { href: "/#process", label: "Delivery Info" },
      { href: "/#contact", label: "Custom Orders" },
      { href: "/#contact", label: "Warranty" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-[var(--color-ink)] pb-8 pt-16 text-[var(--color-bg)]">
      <div className="mx-auto max-w-[1200px] px-6 md:px-12">
        <div className="grid gap-12 border-b border-white/10 pb-12 md:grid-cols-2 md:gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="mb-4 block font-serif text-[28px]">
              Kaasth
              <em className="not-italic text-[var(--color-accent-warm)] italic">.</em>
            </Link>
            <p className="max-w-xs text-[14px] font-light leading-[1.7] text-[var(--color-bg)]/50">
              Factory-direct furniture from Wayanad, Kerala. Wardrobes, beds,
              sofas and full room sets — built by hand, priced without
              middlemen.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h5 className="mb-5 font-serif text-[17px] opacity-90">
                {col.title}
              </h5>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={`${col.title}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-[13px] font-light text-[var(--color-bg)]/50 transition-colors hover:text-[var(--color-bg)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-between gap-2 pt-8 text-xs text-[var(--color-bg)]/35 md:flex-row">
          <span>© 2026 Kaasth Furniture · Wayanad, Kerala</span>
          <span>
            Built with{" "}
            <em className="not-italic text-[var(--color-accent-warm)] italic">
              care
            </em>
            , not shortcuts.
          </span>
        </div>
      </div>
    </footer>
  );
}
