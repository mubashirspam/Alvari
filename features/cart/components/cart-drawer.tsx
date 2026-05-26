"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart, cartSubtotal, cartItemCount } from "../store";
import { formatINR } from "@/lib/utils";
import { buildImageKitUrl } from "@/lib/imagekit";

export function CartDrawer() {
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.close);
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const subtotal = cartSubtotal(items);
  const count = cartItemCount(items);

  // Body scroll lock while drawer is open.
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  return (
    <>
      <div
        onClick={close}
        aria-hidden={!isOpen}
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        aria-label="Your quotation cart"
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 right-0 z-[61] flex w-full max-w-[440px] flex-col bg-[var(--color-bg)] shadow-2xl transition-transform duration-400 ease-[cubic-bezier(0.76,0,0.24,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-[var(--color-line)] px-6 py-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Your quotation
            </p>
            <h2 className="font-serif text-[22px] tracking-[-0.01em] text-[var(--color-ink)]">
              {count === 0 ? "Empty" : `${count} item${count > 1 ? "s" : ""}`}
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close cart"
            className="rounded-full border border-[var(--color-line)] p-2 text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag className="mb-3 h-10 w-10 text-[var(--color-muted)]" />
              <p className="text-[15px] text-[var(--color-muted)]">
                Your quotation is empty.
              </p>
              <Link
                href="/products"
                onClick={close}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] px-5 py-2.5 text-[13px] text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)]"
              >
                Browse furniture
              </Link>
            </div>
          ) : (
            <ul className="space-y-5">
              {items.map((it) => (
                <li key={it.key} className="flex gap-4">
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--color-bg-soft)]">
                    {it.imageUrl ? (
                      <Image
                        src={buildImageKitUrl(it.imageUrl, {
                          width: 200,
                          quality: 75,
                          format: "auto",
                        })}
                        alt={it.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${it.slug}`}
                      onClick={close}
                      className="block text-[14px] font-medium leading-snug text-[var(--color-ink)] hover:text-[var(--color-accent)]"
                    >
                      {it.name}
                    </Link>
                    {it.variantName ? (
                      <p className="mt-0.5 text-[12px] text-[var(--color-muted)]">
                        {it.variantName}
                      </p>
                    ) : null}
                    <p className="mt-1.5 text-[13px] text-[var(--color-ink)]">
                      {formatINR(it.unitPrice)}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-[var(--color-line)]">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => setQuantity(it.key, it.quantity - 1)}
                          className="p-1.5 text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-[13px] font-medium text-[var(--color-ink)]">
                          {it.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => setQuantity(it.key, it.quantity + 1)}
                          className="p-1.5 text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(it.key)}
                        aria-label="Remove item"
                        className="text-[var(--color-muted)] hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 ? (
          <footer className="border-t border-[var(--color-line)] px-6 py-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[13px] text-[var(--color-muted)]">
                Subtotal
              </span>
              <span className="font-serif text-[22px] text-[var(--color-ink)]">
                {formatINR(subtotal)}
              </span>
            </div>
            <p className="mb-4 text-[12px] leading-relaxed text-[var(--color-muted)]">
              Final price is confirmed with you on WhatsApp. Delivery & installation across Kerala are free.
            </p>
            <Link
              href="/checkout"
              onClick={close}
              className="block w-full rounded-full bg-[var(--color-ink)] py-3.5 text-center text-[13px] font-medium uppercase tracking-[0.12em] text-[var(--color-bg)] transition-colors hover:bg-[var(--color-accent)]"
            >
              Request quote
            </Link>
            <button
              type="button"
              onClick={close}
              className="mt-2 block w-full py-2 text-center text-[12px] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            >
              Continue browsing
            </button>
          </footer>
        ) : null}
      </aside>
    </>
  );
}
