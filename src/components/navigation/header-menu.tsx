"use client";

import { useEffect, useState } from "react";
import Link, { useLinkStatus } from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, FileText, X } from "lucide-react";
import { LoadingRing } from "@/components/shared/loading-ring";
import { ThemeToggle } from "@/components/profile/theme-toggle";
import { cn } from "@/lib/utils";

/** Descendant of <Link> — same useLinkStatus → LoadingRing swap used by every
 * other nav link in the app (bottom-nav, sidebar, profile-menu-button). */
function ReportsLinkIcon() {
  const { pending } = useLinkStatus();
  return pending ? <LoadingRing size={16} className="text-current" /> : <FileText size={16} />;
}

/**
 * The app-wide hamburger menu — lives in both places `ProfileMenuButton`
 * renders (compact bar + hero banner), but unlike that button it's visible on
 * desktop too, since neither the sidebar nor the compact bar otherwise has a
 * home for Weekly Reports or Display settings. Hand-rolled dropdown (no
 * Radix/Headless UI in this codebase) using the same AnimatePresence +
 * backdrop pattern as `CaptureSheet`, just anchored top-right instead of as a
 * bottom sheet.
 */
export function HeaderMenu({ variant = "default" }: { variant?: "default" | "banner" }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Menu"
        aria-expanded={open}
        className={cn(
          "pressable flex h-9 w-9 items-center justify-center rounded-full",
          variant === "banner"
            ? "bg-white/80 text-ink shadow-soft backdrop-blur-sm hover:bg-white"
            : "bg-black/[0.04] text-black/60 dark:bg-white/[0.06] dark:text-white/60"
        )}
      >
        <Menu size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="glass-card-solid fixed right-4 z-50 w-64 overflow-hidden p-2"
              style={{ top: "calc(env(safe-area-inset-top) + 60px)" }}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            >
              <div className="mb-1 flex items-center justify-between px-2 py-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
                  Menu
                </span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <X size={15} />
                </button>
              </div>

              <Link
                href="/reports"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-black/[0.04] dark:text-cream-100 dark:hover:bg-white/[0.06]"
              >
                <ReportsLinkIcon />
                Weekly Reports
              </Link>

              <div className="my-2 border-t border-black/[0.06] dark:border-white/[0.08]" />

              <div className="px-2.5 pb-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
                  Display settings
                </span>
              </div>
              <div className="px-2.5 pb-2">
                <ThemeToggle />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
