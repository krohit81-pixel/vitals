import Image from "next/image";
import { ProfileMenuButton } from "./profile-menu-button";

/**
 * Full-bleed banner image rendered by each page itself (not the shared
 * layout) — identical on every tab, both in content and in height, which is
 * what makes it read as one consistent piece of chrome rather than a
 * per-page header. The negative margins cancel NavShell's content padding
 * (`px-4 pt-6 md:px-8 md:pt-10`) so it spans edge-to-edge and sits flush
 * against the sidebar/bottom-nav chrome with no gap — see nav-shell.tsx.
 *
 * The artwork already carries the Vitals wordmark/tagline/logo, so nothing
 * is overlaid on top except the mobile profile button — text on top of this
 * busy an image would just fight it.
 *
 * Each tab's own navigation controls (Day/Week/Month, the range selector,
 * etc.) render as normal page content *below* this, not inside it.
 */
export function AppHeader() {
  return (
    <div className="sticky top-0 z-30 -mx-4 -mt-6 h-36 overflow-hidden shadow-vivid sm:h-44 md:-mx-8 md:-mt-10 md:h-56">
      <Image
        src="/header.PNG"
        alt="Vitals — Eat right, move more, live better"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute right-3 top-3 md:hidden">
        <ProfileMenuButton variant="banner" />
      </div>
    </div>
  );
}
