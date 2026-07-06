"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { type ViewMode, localTodayString } from "@/lib/nutrition/date";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "day", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

export function PeriodSelector({ view }: { view: ViewMode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setView = (next: ViewMode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", next);
    if (!params.get("date")) params.set("date", localTodayString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex gap-1 rounded-xl bg-black/[0.04] p-1 dark:bg-white/[0.06]">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setView(opt.value)}
          className={cn(
            "flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors",
            view === opt.value
              ? "bg-white shadow-soft dark:bg-graphite-50"
              : "text-black/50 dark:text-white/50"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
