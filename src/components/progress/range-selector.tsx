"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { RANGE_LABELS, type RangeOption } from "@/lib/nutrition/date";
import { cn } from "@/lib/utils";

const OPTIONS: RangeOption[] = ["7d", "30d", "90d", "1y"];

export function RangeSelector({ range }: { range: RangeOption }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setRange = (next: RangeOption) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", next);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl bg-black/[0.04] p-1 dark:bg-white/[0.06]">
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          onClick={() => setRange(opt)}
          className={cn(
            "flex-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
            range === opt ? "bg-white shadow-soft dark:bg-graphite-50" : "text-black/50 dark:text-white/50"
          )}
        >
          {RANGE_LABELS[opt]}
        </button>
      ))}
    </div>
  );
}
