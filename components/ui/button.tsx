import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40 disabled:pointer-events-none disabled:opacity-60 cursor-pointer",
  {
    variants: {
      variant: {
        dark: "bg-[var(--color-ink)] text-[var(--color-bg)] hover:bg-[var(--color-accent)] hover:-translate-y-0.5",
        ghost:
          "text-[var(--color-muted)] border-b border-current pb-1 rounded-none hover:text-[var(--color-ink)] px-0",
        outline:
          "border border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-accent)] bg-transparent",
      },
      size: {
        default: "px-9 py-4 text-sm tracking-wider rounded-full",
        sm: "px-5 py-2.5 text-xs tracking-wide rounded-full",
        link: "p-0 text-sm",
      },
    },
    defaultVariants: {
      variant: "dark",
      size: "default",
    },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
