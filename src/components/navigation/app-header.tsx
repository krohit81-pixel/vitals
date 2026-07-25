"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { ProfileMenuButton } from "./profile-menu-button";

/**
 * The hero banner, redesigned to feel like a native iOS card rather than a
 * flat inserted image:
 *
 * - Lives in a rounded (28px), shadowed, overflow-hidden card with a small
 *   horizontal inset (not literally edge-to-edge) — "premium card" instead
 *   of "photo pasted into the page."
 * - The card's top edge still touches the true top of the viewport (no
 *   safe-area padding on the artwork itself) so it extends behind the
 *   status bar/notch when installed as a PWA; only the profile button gets
 *   pushed down by `env(safe-area-inset-top)` so it isn't hidden under it.
 * - A bottom gradient fade blends the artwork into the page's own
 *   background color instead of ending on a hard edge.
 * - A very low-opacity blurred color wash (picking up the artwork's
 *   palette) extends down behind the page content that follows, so the
 *   transition from vivid artwork to plain background doesn't feel abrupt.
 * - On scroll, the card gently compresses and drifts slower than the page
 *   (parallax) instead of just snapping away — see the effect below.
 */
export function AppHeader() {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = Math.min(Math.max(window.scrollY, 0), 180);
      const scale = 1 - y / 1800; // gentle compression, ~10% max
      const translate = y * 0.3; // moves slower than the page — parallax
      const fade = Math.max(1 - y / 260, 0.5);
      el.style.transform = `translateY(${-translate}px) scale(${scale})`;
      el.style.opacity = String(fade);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative -mx-4 -mt-6 md:-mx-8 md:-mt-10">
      {/* Ambient color continuation — extends well past the card itself so
          the page content beneath doesn't cut straight to a flat
          background. Deliberately faint (6-7% opacity). */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[380px] overflow-hidden">
        <div className="absolute -left-10 top-16 h-56 w-56 rounded-full bg-rose-400 opacity-[0.07] blur-3xl" />
        <div className="absolute right-0 top-32 h-64 w-64 rounded-full bg-emerald-400 opacity-[0.07] blur-3xl" />
        <div className="absolute left-1/3 top-52 h-48 w-48 rounded-full bg-orange-300 opacity-[0.06] blur-3xl" />
      </div>

      <div className="relative px-2.5 sm:px-3">
        <div
          ref={cardRef}
          className="relative h-40 origin-top overflow-hidden rounded-[28px] shadow-soft-lg will-change-transform sm:h-48 md:h-60"
        >
          <Image
            src="/header.PNG"
            alt="Vitals — Eat right, move more, live better"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />

          {/* Bottom fade — the artwork dissolves into the page's background
              color instead of ending on a hard edge. */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-cream via-cream/60 to-transparent dark:from-graphite dark:via-graphite/60" />
        </div>

        <div
          className="absolute right-4 sm:right-5 md:hidden"
          style={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
        >
          <ProfileMenuButton variant="banner" />
        </div>
      </div>
    </div>
  );
}
