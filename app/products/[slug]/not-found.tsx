import Link from "next/link";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNav } from "@/components/layout/site-nav";

export default function NotFound() {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        <AnnouncementBar />
        <div className="flex justify-center px-3 pt-3 md:px-5 md:pt-4">
          <SiteNav />
        </div>
      </header>
      <main className="flex min-h-[60vh] items-center justify-center px-6 py-32 text-center">
        <div>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
            404
          </p>
          <h1 className="font-serif text-[48px] leading-tight tracking-tight text-[var(--color-ink)]">
            That piece is not in our workshop.
          </h1>
          <Link
            href="/products"
            className="mt-8 inline-flex rounded-full bg-[var(--color-ink)] px-8 py-3.5 text-sm tracking-wider text-[var(--color-bg)] transition-all hover:bg-[var(--color-accent)]"
          >
            Browse the collection →
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
