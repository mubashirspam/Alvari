"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ScrollRevealProps<T extends ElementType = "div"> = {
  as?: T;
  delay?: 0 | 1 | 2 | 3 | 4;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "delay" | "children">;

const delayStyle: Record<NonNullable<ScrollRevealProps["delay"]>, string> = {
  0: "0ms",
  1: "100ms",
  2: "200ms",
  3: "300ms",
  4: "400ms",
};

export function ScrollReveal<T extends ElementType = "div">({
  as,
  delay = 0,
  className,
  children,
  ...props
}: ScrollRevealProps<T>) {
  const Component = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      el.classList.add("is-in");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Component
      ref={ref}
      className={cn("reveal", className)}
      style={{ transitionDelay: delayStyle[delay] }}
      {...props}
    >
      {children}
    </Component>
  );
}
