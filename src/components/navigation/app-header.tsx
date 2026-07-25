"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { ProfileMenuButton } from "./profile-menu-button";

/**
 * Flat, full-bleed hero banner — deliberately NOT a rounded/shadowed "card"
 * floating over the page (that read as an inserted image rather than
 * integrated chrome). Instead it's a tall, edge-to-edge image whose bottom
 * fades directly into the page's own background color, and the page's
 * normal content (including each tab's own controls) simply continues
 * below it with ordinary spacing — no overlap, no inset margin.
 *
 * The image's top edge touches the true top of the viewport (no safe-area
 * padding on the artwork itself) so it extends behind the status bar/notch
 * when installed as a PWA; only the profile button is pushed down by
 * `env(safe-area-inset-top)` so it isn't hidden under it.
 *
 * On scroll, the image gently compresses and drifts slower than the page
 * (parallax) rather than holding a fixed size until it's cut off.
 */
export function AppHeader() {
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = Math.min(Math.max(window.scrollY, 0), 200);
      const scale = 1 - y / 2000; // gentle compression, ~10% max
      const translate = y * 0.3; // moves slower than the page — parallax
      el.style.transform = `translateY(${-translate}px) scale(${scale})`;
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
      <div ref={imgRef} className="relative h-64 origin-top overflow-hidden will-change-transform sm:h-72 md:h-80">
        <Image
          src="/header.PNG"
          alt="Vitals — Eat right, move more, live better"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        {/* Soft fade into the page's own background — the artwork dissolves
            into the page instead of ending on a hard edge. */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-cream to-transparent dark:from-graphite" />
      </div>

      <div
        className="absolute right-4 sm:right-5 md:hidden"
        style={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
      >
        <ProfileMenuButton variant="banner" />
      </div>
    </div>
  );
}
