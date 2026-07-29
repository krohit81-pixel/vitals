import { ArrowDown, ArrowUp } from "lucide-react";
import type { ConsistencyDirection } from "@/lib/nutrition/consistency";

export interface ScoreBreakdownItem {
  label: string;
  hits: number;
  total: number;
  direction: ConsistencyDirection;
  color: string;
}

/** Makes the health score's composite number legible: which signals feed it,
 * how many days each one landed on the right side of target, and — since
 * "on target" means something different per metric — which direction that
 * even is. Only ever shows metrics that actually fed the score (the caller
 * omits e.g. Steps when there's no step data that period), so this never
 * claims to explain more than it actually does. */
export function ScoreBreakdown({ items }: { items: ScoreBreakdownItem[] }) {
  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const pct = item.total > 0 ? Math.round((item.hits / item.total) * 100) : 0;
        const DirIcon = item.direction === "min" ? ArrowUp : ArrowDown;
        const dirLabel = item.direction === "min" ? "reach" : "stay under";
        return (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-black/55 dark:text-white/55">
                <DirIcon size={11} className="text-black/30 dark:text-white/30" />
                {item.label}
                <span className="text-black/35 dark:text-white/35">· {dirLabel}</span>
              </span>
              <span className="font-medium text-ink dark:text-cream-100">
                {item.hits}/{item.total} days
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: item.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
