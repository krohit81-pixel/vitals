import Image from "next/image";

/**
 * Slim, bright brand banner shown above every tab's content — pulls the
 * gradient straight from the new logo's ring (pink → orange → lime →
 * emerald) so the whole app reads as more colorful/energetic, not just this
 * one strip. Deliberately compact: it's an identity strip, not a header that
 * competes with each page's own title.
 */
export function TopBanner() {
  return (
    <div className="sticky top-0 z-30 flex items-center gap-2.5 bg-gradient-to-r from-rose-500 via-orange-500 to-emerald-500 px-4 py-2.5 shadow-vivid md:px-8">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/25 ring-2 ring-white/40">
        <Image src="/logo.png" alt="" width={22} height={22} className="rounded-full" priority />
      </div>
      <div className="flex min-w-0 items-baseline gap-2 leading-tight">
        <span className="font-display text-[13px] font-semibold tracking-wide text-white">Vitals</span>
        <span className="hidden truncate text-[11px] font-medium text-white/85 sm:inline">
          Eat right · Move more · Live better
        </span>
      </div>
    </div>
  );
}
