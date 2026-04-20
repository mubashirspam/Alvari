"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const links = [
  { href: "/products", label: "Shop" },
  { href: "/#about", label: "About" },
  { href: "/#process", label: "Process" },
  { href: "/#products", label: "Bestsellers" },
  { href: "/#contact", label: "Contact" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-4 transition-all duration-400 ease-[cubic-bezier(0.76,0,0.24,1)] md:px-12 md:py-6",
        scrolled
          ? "border-b border-[var(--color-line)] bg-[var(--color-bg)]/90 backdrop-blur-md"
          : "bg-transparent mix-blend-multiply",
      )}
      style={{ animation: "fade-in 1s 0.4s both" }}
    >
      <Link
        href="/"
        className="flex items-center gap-1 font-serif text-[22px] tracking-tight text-[var(--color-ink)]"
      >
        Kaasth<em className="not-italic text-[var(--color-accent)] italic">.</em>
      </Link>

      <ul className="hidden items-center md:flex">
        {links.map((link, idx) => (
          <li key={link.href} className="flex items-center">
            <Link
              href={link.href}
              className="px-4 py-1 text-[13px] text-[var(--color-muted)] transition-colors duration-200 hover:text-[var(--color-ink)]"
            >
              {link.label}
            </Link>
            {idx < links.length - 1 && (
              <span className="text-[10px] text-[var(--color-muted)]/40">·</span>
            )}
          </li>
        ))}
      </ul>

      <Link
        href="/#contact"
        className="rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-[13px] text-[var(--color-bg)] transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] hover:-translate-y-px hover:bg-[var(--color-accent)]"
      >
        Explore Now
      </Link>
    </nav>
  );
}
