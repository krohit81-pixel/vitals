import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-xl border border-black/[0.08] bg-white/70 px-4 text-sm outline-none transition-colors placeholder:text-black/35 focus:border-emerald-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:placeholder:text-white/35",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
