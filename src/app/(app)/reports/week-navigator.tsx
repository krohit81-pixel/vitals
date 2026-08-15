"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { stepAnchor, formatPeriodLabel, startOfWeek, localTodayString } from "@/lib/nutrition/date";
import { LoadingRing } from "@/components/shared/loading-ring";
import { cn } from "@/lib/utils";

/** Prev/next-week stepper, URL-param-driven (`?week=YYYY-MM-DD`) — same
 * convention as RangeSelector/DateNavigator elsewhere in the app. */
export function WeekNavigator({ anchor }: { anchor: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  // Client-only "today" (server's UTC guess would be wrong for viewers not in
  // UTC) — used only to cap "next" at the current week, not for anything
  // rendered on first paint, so no hydration mismatch risk.
  const [currentWeekStart, setCurrentWeekStart] = useState<string | null>(null);
  useEffect(() => {
    setCurrentWeekStart(startOfWeek(localTodayString()));
  }, []);

  const goTo = (nextAnchor: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", nextAnchor);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const isCurrentOrFutureWeek = currentWeekStart !== null && anchor >= currentWeekStart;

  return (
    <div className="flex items-center justify-between gap-2 print:hidden">
      <button
        onClick={() => goTo(stepAnchor("week", anchor, -1))}
        disabled={pending}
        aria-label="Previous week"
        className="pressable flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.04] text-black/60 disabled:opacity-50 dark:bg-white/[0.06] dark:text-white/60"
      >
        <ChevronLeft size={17} />
      </button>

      <span className={cn("flex items-center gap-1.5 text-sm font-medium text-ink dark:text-cream-100")}>
        {pending && <LoadingRing size={13} className="text-emerald-600 dark:text-emerald-400" />}
        {formatPeriodLabel("week", anchor)}
      </span>

      <button
        onClick={() => goTo(stepAnchor("week", anchor, 1))}
        disabled={pending || isCurrentOrFutureWeek}
        aria-label="Next week"
        className="pressable flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.04] text-black/60 disabled:opacity-30 dark:bg-white/[0.06] dark:text-white/60"
      >
        <ChevronRight size={17} />
      </button>
    </div>
  );
}
