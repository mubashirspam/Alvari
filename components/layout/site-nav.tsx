"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/env";

const links = [
  { href: "/products", label: "Shop" },
  { href: "/#about", label: "About" },
  { href: "/#process", label: "Process" },
  { href: "/#products", label: "Bestsellers" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <nav
      className={cn(
        "relative flex w-full max-w-[980px] items-center justify-between gap-2 rounded-full px-3 py-2 backdrop-blur-xl transition-all duration-400 ease-[cubic-bezier(0.76,0,0.24,1)]",
        scrolled
          ? "border-[var(--color-line)] bg-[var(--color-bg)]/20 shadow-lg shadow-white/10"
          : "border-white/30 bg-white/60 shadow-sm shadow-black/5",
      )}
    >
      <Link
        href="/"
        className="pl-3 pr-2 font-serif text-[20px] leading-none tracking-tight text-[var(--color-ink)] transition-colors"
      >
        Alvari
        <em className="not-italic italic text-[var(--color-accent)]">
          .
        </em>
      </Link>

      <ul className="hidden items-center md:flex">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="rounded-full px-3.5 py-1.5 text-[13px] text-[var(--color-muted)] transition-colors duration-200 hover:bg-[var(--color-ink)]/5 hover:text-[var(--color-ink)]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-1.5">
        <a
          href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent("Hi Alvari, I'd like to know more about your furniture")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1.5 rounded-full bg-[var(--color-ink)] px-4 py-2 text-[13px] font-medium text-[var(--color-bg)] transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] hover:bg-[var(--color-accent)] md:inline-flex"
        >
          <MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />
          Connect Us
        </a>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-line)] text-[var(--color-ink)] transition-colors md:hidden"
        >
          {open ? (
            <X className="h-4.5 w-4.5" strokeWidth={1.5} />
          ) : (
            <Menu className="h-4.5 w-4.5" strokeWidth={1.5} />
          )}
        </button>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-40 flex flex-col gap-1 rounded-3xl border border-[var(--color-line)] bg-[var(--color-bg)] p-3 shadow-2xl shadow-black/10 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-2xl px-4 py-3 font-serif text-lg text-[var(--color-ink)] transition-colors hover:bg-[var(--color-bg-soft)]"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent("Hi Alvari, I'd like to know more about your furniture")}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--color-ink)] px-5 py-3 text-center text-sm font-medium text-[var(--color-accent-light)]"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2} />
            Connect Us
          </a>
        </div>
      )}
    </nav>
  );
}
