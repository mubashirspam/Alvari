"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function HeaderWrapper({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div
      className={cn(
        "w-full max-w-[980px] rounded-3xl border transition-all duration-400 ease-[cubic-bezier(0.76,0,0.24,1)] backdrop-blur-xl",
        scrolled
          ? "border-[var(--color-line)] bg-[var(--color-bg)]/80 shadow-lg shadow-black/5"
          : "border-white/30 bg-white/70 shadow-sm shadow-black/5",
      )}
    >
      {children}
    </div>
  );
}
