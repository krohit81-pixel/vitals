import Image from "next/image";
import type { ReactNode } from "react";
import { ProfileMenuButton } from "./profile-menu-button";
import { APP_VERSION } from "@/lib/version";

/**
 * Full-bleed gradient header rendered by each page itself (not the shared
 * layout) — every tab passes its own navigation controls (Day/Week/Month,
 * 7d/30d/90d/1y, a date navigator, or nothing) as `controls`, but the
 * banner's height and position are identical everywhere. The negative
 * margins cancel NavShell's content padding (`px-4 pt-6 md:px-8 md:pt-10`)
 * so it spans edge-to-edge and sits flush against the sidebar/bottom-nav
 * chrome with no gap — see nav-shell.tsx.
 *
 * The controls row has a fixed min-height rather than a content-driven one
 * *specifically* so tabs with no controls (Coach, Profile) reserve exactly
 * the same vertical space as tabs that have them. That reserved band is
 * deliberately blank — a spot for a future banner photo (meal/workout
 * imagery), not a layout accident.
 */
export function AppHeader({ controls }: { controls?: ReactNode }) {
  return (
    <div className="sticky top-0 z-30 -mx-4 -mt-6 bg-gradient-to-r from-rose-500 via-orange-500 to-emerald-500 px-4 shadow-vivid md:-mx-8 md:-mt-10 md:px-8">
      <div className="flex items-center gap-2.5 py-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/25 ring-2 ring-white/40">
          <Image src="/logo.png" alt="" width={22} height={22} className="rounded-full" priority />
        </div>
        <div className="flex min-w-0 items-baseline gap-1.5 leading-tight">
          <span className="font-display text-[13px] font-semibold tracking-wide text-white">Vitals</span>
          <span className="rounded-full bg-white/20 px-1.5 py-[1px] text-[9px] font-semibold text-white/90">
            v{APP_VERSION}
          </span>
        </div>
        <span className="ml-1 hidden truncate text-[11px] font-medium text-white/85 sm:inline">
          Eat right · Move more · Live better
        </span>
        <div className="ml-auto">
          <ProfileMenuButton variant="banner" />
        </div>
      </div>

      {/* Fixed height, not content-driven — Dashboard stacks two control
          rows (Today/Week/Month + the date arrows) while Progress has one
          and Coach/Profile have none, but every tab reserves the exact same
          block here so the banner is the same height everywhere. */}
      <div className="flex min-h-[96px] items-start pb-3">{controls}</div>
    </div>
  );
}
