import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section
      id="home"
      className="relative bg-[var(--color-bg)] md:p-5"
    >
      <div className="relative min-h-screen w-full overflow-hidden bg-[#1a1a14] md:min-h-[calc(100vh-40px)] md:rounded-[28px]">
        <Image
          src="/hero.jpeg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        <div
          className="relative z-10 flex min-h-screen w-full flex-col justify-end px-6 pt-32 pb-14 md:min-h-[calc(100vh-40px)] md:px-12 md:pt-36 md:pb-20 lg:pb-24"
          style={{ animation: "fade-up 1s 0.6s var(--ease-alvari) both" }}
        >
          <div className="max-w-[640px]">
            <h1 className="font-serif text-[clamp(38px,6vw,72px)] font-normal leading-[1.05] tracking-[-0.02em] text-white">
              Handcrafted
              <br />
              <em className="not-italic text-[var(--color-accent-warm)]">
                furniture
              </em>{" "}
              direct from our workshop.
            </h1>

            <p className="mt-5 max-w-md text-[15px] font-light leading-relaxed text-white/80">
              Premium almirahs, beds, sofas, and complete room sets — made to
              last, priced without the markup.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/products"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-medium tracking-wider text-[var(--color-ink)] transition-all duration-300 hover:bg-[var(--color-accent-warm)] hover:text-white"
              >
                Explore Collection
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="#process"
                className="text-sm font-medium text-white/70 transition-colors duration-300 hover:text-white"
              >
                How it works →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
