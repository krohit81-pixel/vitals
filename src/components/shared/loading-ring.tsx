import { cn } from "@/lib/utils";

/**
 * Small spinning ring used anywhere an action needs to visibly acknowledge
 * "yes, that click registered and something is happening" — range/date
 * navigation, regenerate buttons, etc. Uses `border-current` so it inherits
 * whatever text color the parent sets (pass a `text-*` class via className).
 */
export function LoadingRing({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("inline-block shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80", className)}
      style={{ width: size, height: size }}
    />
  );
}
