import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-20 w-full resize-y rounded-[4px] border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3.5 text-[15px] font-light text-[var(--color-ink)] transition-colors duration-200 placeholder:text-[var(--color-muted)]/60 focus:border-[var(--color-accent)] focus:outline-none",
        className,
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
