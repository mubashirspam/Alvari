"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function HeaderWrapper({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div
      className={cn(
        "flex justify-center transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]",
        scrolled ? "px-3 pt-2 md:px-5 md:pt-3" : "px-0 pt-0",
      )}
    >
      <div
        className={cn(
          "w-full transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]",
          scrolled
            ? "max-w-[980px] rounded-3xl border border-[var(--color-line)] bg-[var(--color-bg)]/85 shadow-lg shadow-black/8 backdrop-blur-xl"
            : "border-b border-[var(--color-line)] bg-[var(--color-bg)]",
        )}
      >
        {children}
      </div>
    </div>
  );
}
