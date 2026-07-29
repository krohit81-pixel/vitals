"use client";

import Link from "next/link";
import { Footprints, ChevronRight } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { DailyMetricPoint } from "@/lib/nutrition/get-health-metrics";
import { parseDateString } from "@/lib/nutrition/date";

const COLOR = "#F59E0B";
const STEPS_GOAL = 8000;

export function ActivityCard({ series, totalWorkouts }: { series: DailyMetricPoint[]; totalWorkouts: number }) {
  const nonZero = series.filter((p) => p.value > 0);
  const avg = nonZero.length > 0 ? Math.round(nonZero.reduce((s, p) => s + p.value, 0) / nonZero.length) : null;
  const showDailyTicks = series.length <= 8;

  return (
    <Link href="/progress/metric/step_count" className="pressable glass-card block p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: `${COLOR}22` }}>
            <Footprints size={14} style={{ color: COLOR }} />
          </div>
          <span className="text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
            Activity
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-black/50 dark:text-white/50">
            {totalWorkouts} workout{totalWorkouts === 1 ? "" : "s"}
          </span>
          <ChevronRight size={15} className="text-black/25 dark:text-white/25" />
        </div>
      </div>

      {avg !== null ? (
        <>
          <p className="font-display text-2xl font-bold tabular-nums text-ink dark:text-cream-100">
            {avg.toLocaleString()}
            <span className="ml-1 text-sm font-normal text-black/40 dark:text-white/40">steps/day</span>
          </p>
          <p className="mt-0.5 text-xs text-black/40 dark:text-white/40">Goal {STEPS_GOAL.toLocaleString()} steps</p>

          <div className="mt-3 h-16 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(d: string) => parseDateString(d).toLocaleDateString(undefined, { weekday: "short" })}
                  interval={showDailyTicks ? 0 : "preserveStartEnd"}
                  tick={{ fontSize: 9, fill: "currentColor", opacity: 0.4 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number) => [`${Math.round(value).toLocaleString()} steps`, undefined]}
                  labelFormatter={(d: string) => parseDateString(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 30px -6px rgba(0,0,0,0.15)", fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={18} fill={COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <p className="text-xs text-black/40 dark:text-white/40">No step data this period.</p>
      )}
    </Link>
  );
}
