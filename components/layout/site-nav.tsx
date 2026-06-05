"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, MessageCircle, User, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/env";
import { CartButton } from "@/features/cart/components/cart-button";
import { BrandLogo } from "@/components/layout/brand-logo";
import {
  type CategoryTreeNode,
  categoryNodeHref,
} from "@/features/category-tree/types";

const STATIC_LINKS = [
  { href: "/products?sort=new", label: "New Arrivals" },
  { href: "/#process", label: "Our Process" },
] as const;

type Props = {
  variant?: "standalone" | "clubbed";
  categoryTree?: CategoryTreeNode[];
};

export function SiteNav({ variant = "standalone", categoryTree = [] }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  const hoveredNode = categoryTree.find((n) => n.id === hovered) ?? null;

  useEffect(() => {
    if (variant === "clubbed") return;
    const handler = () => setScrolled(window.scrollY > 40);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [variant]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const pillBase =
    "block whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] transition-colors duration-200";
  const pillMuted = cn(
    pillBase,
    "text-[var(--color-muted)] hover:bg-[var(--color-ink)]/5 hover:text-[var(--color-ink)]",
  );
  const pillAccent = cn(
    pillBase,
    "font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10",
  );
  const pillActive = cn(
    pillBase,
    "bg-[var(--color-ink)]/5 text-[var(--color-ink)] font-medium",
  );

  return (
    <div
      className={
        variant === "clubbed"
          ? "relative w-full"
          : cn(
              "relative w-full max-w-[980px] transition-all duration-400 ease-[cubic-bezier(0.76,0,0.24,1)]",
              scrolled
                ? "rounded-full border-[var(--color-line)] bg-[var(--color-bg)]/80 shadow-lg shadow-black/5"
                : "rounded-full border-white/30 bg-white/70 shadow-sm shadow-black/5",
            )
      }
      onMouseLeave={() => setHovered(null)}
      
    >
      {/* ── Main nav row ── */}
      <nav className="relative w-full py-3">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-2 px-6 md:px-5">
        {/* Logo */}
        <Link
          href="/"
          aria-label="Alvari — home"
          className="flex items-center pr-2 text-[var(--color-ink)] transition-colors"
        >
          <BrandLogo height={22} />
        </Link>

        {/* Desktop links */}
        <ul className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {/* New Arrivals */}
          <li className="flex-shrink-0">
            <Link href="/products?sort=new" className={pillAccent}>
              New Arrivals
            </Link>
          </li>

          {/* Category nodes from DB */}
          {categoryTree.map((node) => {
            const href = categoryNodeHref(node);
            const isActive = hovered === node.id;
            const hasChildren = node.children.length > 0;
            const cls = isActive ? pillActive : pillMuted;

            return (
              <li key={node.id} className="flex-shrink-0">
                {href ? (
                  <Link
                    href={href}
                    className={cn(cls, "inline-flex items-center gap-0.5")}
                    onMouseEnter={() => setHovered(node.id)}
                  >
                    {node.name}
                    {hasChildren && (
                      <ChevronDown
                        className={cn(
                          "h-3 w-3 transition-transform duration-200",
                          isActive && "rotate-180",
                        )}
                        strokeWidth={2}
                      />
                    )}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={cn(cls, "inline-flex cursor-default items-center gap-0.5")}
                    onMouseEnter={() => setHovered(node.id)}
                  >
                    {node.name}
                    {hasChildren && (
                      <ChevronDown
                        className={cn(
                          "h-3 w-3 transition-transform duration-200",
                          isActive && "rotate-180",
                        )}
                        strokeWidth={2}
                      />
                    )}
                  </button>
                )}
              </li>
            );
          })}

          {/* Static: Process */}
          <li className="flex-shrink-0">
            <Link href="/#process" className={pillMuted}>
              Our Process
            </Link>
          </li>
        </ul>

        {/* Right icons */}
        <div className="flex items-center gap-1.5">
          <Link
            href="/account/orders"
            aria-label="My orders"
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-[var(--color-line)] text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)] md:inline-flex"
          >
            <User className="h-4 w-4" strokeWidth={1.6} />
          </Link>
          <CartButton className="h-9 w-9" />
          <button
            onClick={() =>
              window.open(
                `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
                  "Hi Alvari, I'd like to know more about your furniture",
                )}`,
                "_blank",
              )
            }
            className="hidden items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-4 py-2 text-[13px] font-semibold text-[var(--color-navy-deep)] transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] hover:bg-[var(--color-accent-warm)] md:inline-flex cursor-pointer"
          >
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />
            Connect Us
          </button>

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

        {/* Mobile drawer */}
        {open && (
          <div className="absolute inset-x-0 top-[calc(100%+8px)] z-40 flex flex-col gap-1 rounded-3xl border border-[var(--color-line)] bg-[var(--color-bg)] p-3 shadow-2xl shadow-black/10 md:hidden">
            <Link
              href="/products?sort=new"
              onClick={() => setOpen(false)}
              className="rounded-2xl px-4 py-3 text-sm font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-bg-soft)]"
            >
              New Arrivals
            </Link>

            {categoryTree.map((node) => {
              const href = categoryNodeHref(node);
              const isExpanded = mobileExpanded === node.id;
              const hasChildren = node.children.length > 0;

              return (
                <div key={node.id}>
                  <div className="flex items-center">
                    {href ? (
                      <Link
                        href={href}
                        onClick={() => setOpen(false)}
                        className="flex-1 rounded-2xl px-4 py-3 font-serif text-lg text-[var(--color-ink)] transition-colors hover:bg-[var(--color-bg-soft)]"
                      >
                        {node.name}
                      </Link>
                    ) : (
                      <span className="flex-1 rounded-2xl px-4 py-3 font-serif text-lg text-[var(--color-ink)]">
                        {node.name}
                      </span>
                    )}
                    {hasChildren && (
                      <button
                        type="button"
                        onClick={() =>
                          setMobileExpanded(isExpanded ? null : node.id)
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-muted)] transition-colors hover:bg-[var(--color-bg-soft)]"
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            isExpanded && "rotate-180",
                          )}
                          strokeWidth={1.8}
                        />
                      </button>
                    )}
                  </div>

                  {isExpanded && hasChildren && (
                    <ul className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-[var(--color-line)] pl-3">
                      {node.children.map((child) => {
                        const childHref =
                          categoryNodeHref(child) ?? "/products";
                        return (
                          <li key={child.id}>
                            <Link
                              href={childHref}
                              onClick={() => setOpen(false)}
                              className="block rounded-xl px-3 py-2.5 text-[14px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-bg-soft)] hover:text-[var(--color-ink)]"
                            >
                              {child.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}

            <Link
              href="/#process"
              onClick={() => setOpen(false)}
              className="rounded-2xl px-4 py-3 font-serif text-lg text-[var(--color-ink)] transition-colors hover:bg-[var(--color-bg-soft)]"
            >
              Our Process
            </Link>

            <button
              onClick={() => {
                window.open(
                  `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
                    "Hi Alvari, I'd like to know more about your furniture",
                  )}`,
                  "_blank",
                );
                setOpen(false);
              }}
              className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--color-accent)] px-5 py-3 text-center text-sm font-semibold text-[var(--color-navy-deep)] cursor-pointer"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={2} />
              Connect Us
            </button>
          </div>
        )}
        </div>{/* ── end mx-auto container ── */}
      </nav>

      {/* ── Subcategory panel (desktop hover) ── */}
      {hoveredNode && hoveredNode.children.length > 0 && (
        <div className="hidden border-t border-[var(--color-line)] md:block">
          <div className="mx-auto max-w-[1400px] px-6 py-2.5 md:px-10">
          <ul className="flex flex-wrap items-center gap-1">
            {hoveredNode.children.map((child) => {
              const href = categoryNodeHref(child) ?? "/products";
              return (
                <li key={child.id}>
                  <Link
                    href={href}
                    className="block whitespace-nowrap rounded-full px-3 py-1.5 text-[12.5px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-ink)]/5 hover:text-[var(--color-ink)]"
                  >
                    {child.name}
                  </Link>
                </li>
              );
            })}
          </ul>
          </div>
        </div>
      )}
    </div>
  );
}
