import { Check, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { parseDateString } from "@/lib/nutrition/date";
import { currentStreakLength, type StreakDay } from "@/lib/nutrition/streak";
import { cn } from "@/lib/utils";

export function StreakCard({ days }: { days: StreakDay[] }) {
  const streak = currentStreakLength(days);

  return (
    <Card className="flex items-center gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-400/15">
        <Flame size={20} className="text-amber-500" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-semibold text-ink dark:text-cream-100">
          {streak > 0 ? `${streak} day${streak === 1 ? "" : "s"} streak` : "Start a streak"}
        </p>
        <div className="mt-2 flex gap-1.5">
          {days.map((d) => {
            const label = parseDateString(d.date).toLocaleDateString(undefined, { weekday: "narrow" });
            return (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium",
                    d.hit
                      ? "bg-emerald-500 text-white"
                      : "bg-black/[0.06] text-black/30 dark:bg-white/[0.08] dark:text-white/30"
                  )}
                >
                  {d.hit ? <Check size={12} strokeWidth={3} /> : null}
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
