"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { RANGE_LABELS, type RangeOption } from "@/lib/nutrition/date";
import { LoadingRing } from "@/components/shared/loading-ring";
import { cn } from "@/lib/utils";

const OPTIONS: RangeOption[] = ["7d", "30d", "90d", "1y"];

export function RangeSelector({ range }: { range: RangeOption }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  // The `range` prop only updates once the server has re-rendered with the
  // new searchParams — during the transition it still reflects the *old*
  // selection, so the tapped option is tracked separately to know which pill
  // should show the spinner right away.
  const [pendingOption, setPendingOption] = useState<RangeOption | null>(null);

  const setRange = (next: RangeOption) => {
    if (next === range) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", next);
    setPendingOption(next);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-xl bg-black/[0.04] p-1 dark:bg-white/[0.06]">
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          onClick={() => setRange(opt)}
          disabled={pending}
          className={cn(
            "relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-medium transition-colors disabled:opacity-70",
            range === opt ? "bg-white shadow-soft dark:bg-graphite-50" : "text-black/50 dark:text-white/50"
          )}
        >
          {pending && pendingOption === opt && (
            <LoadingRing size={11} className="text-emerald-600 dark:text-emerald-400" />
          )}
          {RANGE_LABELS[opt]}
        </button>
      ))}
    </div>
  );
}
