"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import {
  type ViewMode,
  localTodayString,
  stepAnchor,
  periodBounds,
  formatPeriodLabel,
} from "@/lib/nutrition/date";

export function DateNavigator({ view }: { view: ViewMode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramAnchor = searchParams.get("date");

  // Same rough guess the server uses for its own first paint (see
  // dashboard/page.tsx / meals/page.tsx) — using it here too means the label
  // renders immediately instead of a blank placeholder, with no hydration
  // mismatch, since toISOString() is UTC-based regardless of which machine
  // (server or client) evaluates it.
  const anchor = paramAnchor ?? new Date().toISOString().slice(0, 10);

  // "Today" in the viewer's actual timezone is only knowable client-side —
  // see date.ts. Used for the next-button disabled state and the date
  // picker's max, and to self-correct the guess above in the rare case it's
  // actually wrong (timezones ahead of UTC, in the few hours after their
  // local midnight, before UTC has rolled over).
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    const t = localTodayString();
    setToday(t);
    // Only touch the URL if there was no explicit date param yet — never
    // overwrite a date the viewer intentionally navigated to via prev/next
    // or the calendar picker, and only when our guess was actually wrong,
    // not on every load (that unconditional replace was the perf bug).
    if (!paramAnchor && t !== anchor) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("date", t);
      router.replace(`${pathname}?${params.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = (direction: 1 | -1) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", stepAnchor(view, anchor, direction));
    router.push(`${pathname}?${params.toString()}`);
  };

  const jumpTo = (dateStr: string) => {
    if (!dateStr) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", dateStr);
    router.push(`${pathname}?${params.toString()}`);
  };

  const nextPeriodStart = periodBounds(view, stepAnchor(view, anchor, 1))[0];
  const nextDisabled = today !== null && nextPeriodStart > today;

  return (
    <div className="flex items-center justify-between gap-2">
      <button
        onClick={() => navigate(-1)}
        aria-label="Previous"
        className="pressable flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.06]"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="relative flex flex-1 items-center justify-center gap-1.5 text-sm font-medium">
        <CalendarDays size={14} className="text-black/40 dark:text-white/40" />
        <span>{formatPeriodLabel(view, anchor)}</span>
        <input
          type="date"
          value={anchor}
          max={today ?? undefined}
          onChange={(e) => jumpTo(e.target.value)}
          aria-label="Jump to date"
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </div>

      <button
        onClick={() => navigate(1)}
        disabled={nextDisabled}
        aria-label="Next"
        className="pressable flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.04] disabled:opacity-30 dark:bg-white/[0.06]"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
