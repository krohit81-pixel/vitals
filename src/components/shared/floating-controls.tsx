import type { ReactNode } from "react";

/**
 * Wraps a tab's own navigation controls (Day/Week/Month, the date arrows,
 * the range selector) in a rounded, shadowed card that overlaps the bottom
 * of AppHeader by ~18px — the "floating card sitting on top of the hero"
 * depth cue Apple Fitness/Health use, instead of controls starting flush
 * where the artwork ends. Must be rendered as the element immediately after
 * AppHeader (ideally both wrapped together, isolated from any `space-y-*`
 * on an outer container) for the negative margin to land in the right
 * place — see the pages that use it.
 */
export function FloatingControls({ children }: { children: ReactNode }) {
  return (
    <div className="relative -mt-[18px] space-y-2.5 rounded-2xl border border-black/[0.04] bg-white/95 p-2.5 shadow-soft-lg backdrop-blur-md dark:border-white/[0.06] dark:bg-graphite-50/95 md:-mt-5">
      {children}
    </div>
  );
}
