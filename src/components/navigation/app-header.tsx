"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { ProfileMenuButton } from "./profile-menu-button";
import { HeaderMenu } from "./header-menu";
import { APP_VERSION } from "@/lib/version";

// How much scroll (px) it takes for the compact bar to fully appear.
const COLLAPSE_DISTANCE = 90;
// How much scroll (px) the hero's own compress/parallax responds to before capping out.
const HERO_SCROLL_CAP = 220;

/**
 * Large-title-collapses-to-compact-bar header, the pattern Apple Music/
 * Health use: a big, flat hero image on first paint (no card, no shadow —
 * just artwork extending edge-to-edge and fading into the page), which
 * compresses and parallax-drifts as you scroll away from it. Once you've
 * scrolled far enough that the hero isn't doing useful work anymore, a
 * slim frosted nav bar fades/slides in and pins to the true top — so
 * there's always brand orientation and a way back to Profile, without the
 * artwork permanently eating vertical space.
 *
 * Both the hero's floating profile button and the compact bar's are
 * offset by `env(safe-area-inset-top)` so neither sits under a notch/status
 * bar when installed as a PWA; the artwork itself still extends behind it.
 */
export function AppHeader() {
  const heroRef = useRef<HTMLDivElement>(null);
  const compactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const compact = compactRef.current;
    if (!hero || !compact) return;
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = Math.min(Math.max(window.scrollY, 0), HERO_SCROLL_CAP);
      const progress = Math.min(y / COLLAPSE_DISTANCE, 1);

      const scale = 1 - y / 2000;
      const translate = y * 0.3; // slower than the page — parallax
      hero.style.transform = `translateY(${-translate}px) scale(${scale})`;

      compact.style.opacity = String(progress);
      compact.style.transform = `translateY(${(1 - progress) * -10}px)`;
      compact.style.pointerEvents = progress > 0.6 ? "auto" : "none";
      compact.setAttribute("aria-hidden", progress < 0.6 ? "true" : "false");
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    // A single real wrapper (not a Fragment) — AppHeader must render as one
    // child so it stays the first child of the page's `space-y-*` container
    // and doesn't pick up an unwanted top margin (and so the fixed compact
    // bar, nested here rather than as a sibling, isn't affected by one either).
    <div className="print:hidden">
      {/* Compact bar — invisible at rest, fades/slides in once scrolled.
          `fixed` + rendered outside the hero's transformed subtree so it
          anchors to the real viewport, not the hero's own transform. */}
      <div
        ref={compactRef}
        className="fixed left-0 right-0 top-0 z-40 flex items-center gap-2.5 border-b border-black/[0.06] bg-white/80 px-4 opacity-0 shadow-soft backdrop-blur-lg transition-opacity duration-150 ease-out dark:border-white/[0.08] dark:bg-graphite/80 md:left-64 md:px-8"
        style={{ paddingTop: "env(safe-area-inset-top)", height: "calc(env(safe-area-inset-top) + 52px)" }}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full">
          <Image src="/logo.png" alt="" width={28} height={28} className="rounded-full" />
        </div>
        <span className="flex items-baseline gap-1.5">
          <span className="font-display text-[15px] font-semibold text-ink dark:text-cream-100">Vitals</span>
          <span className="text-[10px] font-medium text-black/40 dark:text-white/40">v{APP_VERSION}</span>
        </span>
        <div className="ml-auto flex items-center gap-2">
          <HeaderMenu />
          <div className="md:hidden">
            <ProfileMenuButton />
          </div>
        </div>
      </div>

      {/* Large hero */}
      <div className="relative -mx-4 -mt-6 md:-mx-8 md:-mt-10">
        <div
          ref={heroRef}
          className="relative h-64 origin-top overflow-hidden will-change-transform sm:h-72 md:h-80"
        >
          <Image
            src="/header_new.PNG"
            alt="Vitals — Eat right, move more, live better"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />

          {/* Soft fade into the page's own background — the artwork
              dissolves into the page instead of ending on a hard edge. */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-cream to-transparent dark:from-graphite" />
        </div>

        <div
          className="absolute right-4 flex items-center gap-2 sm:right-5"
          style={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
        >
          <HeaderMenu variant="banner" />
          <div className="md:hidden">
            <ProfileMenuButton variant="banner" />
          </div>
        </div>
      </div>
    </div>
  );
}
