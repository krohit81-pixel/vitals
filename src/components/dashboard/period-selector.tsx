"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { type ViewMode, localTodayString } from "@/lib/nutrition/date";
import { LoadingRing } from "@/components/shared/loading-ring";
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
  const [pending, startTransition] = useTransition();
  // `view` prop only updates once the server re-renders — track the tapped
  // option locally so the right pill shows the spinner immediately.
  const [pendingView, setPendingView] = useState<ViewMode | null>(null);

  const setView = (next: ViewMode) => {
    if (next === view) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", next);
    if (!params.get("date")) params.set("date", localTodayString());
    setPendingView(next);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex gap-1 rounded-xl bg-white/15 p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setView(opt.value)}
          disabled={pending}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors disabled:opacity-80",
            view === opt.value ? "bg-white text-ink shadow-soft" : "text-white/85"
          )}
        >
          {pending && pendingView === opt.value && <LoadingRing size={11} className="text-emerald-600" />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
