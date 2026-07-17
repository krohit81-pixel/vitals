"use client";

import { useEffect, useState } from "react";
import { Check, X, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { localTodayString, parseDateString } from "@/lib/nutrition/date";
import { classifyStreakDay, type StreakDay } from "@/lib/nutrition/streak";
import { cn } from "@/lib/utils";

export function StreakCard({ days }: { days: StreakDay[] }) {
  // "Today" must come from the browser — see date.ts's comments on why the
  // server can't determine this reliably (UTC clock vs. the viewer's local
  // day). Null until mounted; every day renders as "pending" until then,
  // which is a safe default (never flashes a wrong hit/miss).
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    setToday(localTodayString());
  }, []);

  return (
    <Card className="flex items-center gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-400/15">
        <Flame size={20} className="text-amber-500" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex gap-1.5">
          {days.map((d) => {
            const label = parseDateString(d.date).toLocaleDateString(undefined, { weekday: "narrow" });
            const state = today ? classifyStreakDay(d, today) : "pending";

            return (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium",
                    state === "hit" && "bg-emerald-500 text-white",
                    state === "miss" && "bg-red-100 text-red-500 dark:bg-red-500/15",
                    (state === "pending" || state === "future") &&
                      "bg-black/[0.06] text-black/30 dark:bg-white/[0.08] dark:text-white/30"
                  )}
                >
                  {state === "hit" && <Check size={12} strokeWidth={3} />}
                  {state === "miss" && <X size={12} strokeWidth={3} />}
                </div>
                <span className="text-[9px] text-black/35 dark:text-white/35">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
