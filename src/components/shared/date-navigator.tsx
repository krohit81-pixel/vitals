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
  const anchor = searchParams.get("date");

  // "Today" is only knowable client-side (server runs in UTC) — see date.ts.
  // Also handles first load with no `date` param yet, by redirecting to it.
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    const t = localTodayString();
    setToday(t);
    if (!anchor) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("date", t);
      router.replace(`${pathname}?${params.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!anchor) {
    return <div className="h-9" />; // placeholder while the redirect above resolves
  }

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
