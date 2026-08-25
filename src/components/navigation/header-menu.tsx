"use client";

import Link, { useLinkStatus } from "next/link";
import { Menu } from "lucide-react";
import { LoadingRing } from "@/components/shared/loading-ring";
import { cn } from "@/lib/utils";

/** Descendant of <Link> — same useLinkStatus → LoadingRing swap used by every
 * other nav link in the app (bottom-nav, sidebar). */
function MenuIcon() {
  const { pending } = useLinkStatus();
  return pending ? <LoadingRing size={16} className="text-current" /> : <Menu size={18} />;
}

/**
 * The header's hamburger button — a straight shortcut to Profile, not a
 * dropdown. Went through two earlier shapes (v0.9.0 added a real dropdown
 * panel for Weekly Reports + Display settings alongside a separate Profile
 * button; v0.9.1 folded Profile into that same dropdown) before landing
 * here: Weekly Reports and Display settings now live as cards *on* the
 * Profile page itself (see `src/app/(app)/profile/page.tsx`), so the
 * hamburger's only job is getting you there — "click the hamburger, the
 * Profile tab opens with all these options." `md:hidden` because desktop
 * already has Profile in the sidebar.
 */
export function HeaderMenu({ variant = "default" }: { variant?: "default" | "banner" }) {
  return (
    <Link
      href="/profile"
      aria-label="Profile and settings"
      className={cn(
        "pressable flex h-9 w-9 items-center justify-center rounded-full md:hidden",
        variant === "banner"
          ? "bg-white/80 text-ink shadow-soft backdrop-blur-sm hover:bg-white"
          : "bg-black/[0.04] text-black/60 dark:bg-white/[0.06] dark:text-white/60"
      )}
    >
      <MenuIcon />
    </Link>
  );
}
