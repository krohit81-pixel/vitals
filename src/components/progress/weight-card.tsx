"use client";

import Link from "next/link";
import { Scale, ArrowUp, ArrowDown, ChevronRight } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import type { WeightPoint } from "@/lib/nutrition/get-weight-series";

const COLOR = "#3B82F6";

const BMI_CATEGORIES = [
  { max: 18.5, label: "Underweight", color: "#3B82F6" },
  { max: 25, label: "Normal", color: "#10B981" },
  { max: 30, label: "Overweight", color: "#F59E0B" },
  { max: Infinity, label: "Obese", color: "#EF4444" },
];

function categorizeBmi(bmi: number) {
  return BMI_CATEGORIES.find((c) => bmi < c.max) ?? BMI_CATEGORIES[BMI_CATEGORIES.length - 1]!;
}

/** Weight and BMI are the same underlying measurement viewed two ways, so
 * they live in one card instead of two separate tiles competing for
 * attention in the grid. */
export function WeightCard({
  series,
  currentWeight,
  goalWeightKg,
  goalProgressPct,
  bmi,
}: {
  /** Readings within the selected range, oldest first — sparse, so may be
   * empty even when a lifetime weight history exists. */
  series: WeightPoint[];
  currentWeight: { weight: number; unit: "kg" | "lb" } | null;
  goalWeightKg: number | null;
  goalProgressPct: number | null;
  bmi: number | null;
}) {
  const bmiCategory = bmi !== null ? categorizeBmi(bmi) : null;

  const periodDeltaRaw =
    series.length >= 2 ? series[series.length - 1]!.value - series[0]!.value : null;
  const periodDelta = periodDeltaRaw !== null ? Math.round(periodDeltaRaw * 10) / 10 : null;

  // Losing weight isn't universally "good" — some goals are to gain. Only
  // color-code the delta when there's an actual goal to measure "closer" or
  // "further" against; otherwise it's plain description, same neutral
  // framing MetricTrendCard uses for over/under.
  const movedTowardGoal =
    goalWeightKg !== null && periodDeltaRaw !== null && series.length >= 2
      ? Math.abs(series[series.length - 1]!.value - goalWeightKg) < Math.abs(series[0]!.value - goalWeightKg)
      : null;

  const sparkData = series.map((p, i) => ({ i, value: p.value }));

  return (
    <Link href="/progress/weight" className="pressable glass-card block p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: `${COLOR}22` }}>
            <Scale size={14} style={{ color: COLOR }} />
          </div>
          <span className="text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
            Weight
          </span>
        </div>
        <ChevronRight size={15} className="text-black/25 dark:text-white/25" />
      </div>

      {currentWeight ? (
        <>
          <p className="font-display text-2xl font-bold tabular-nums text-ink dark:text-cream-100">
            {currentWeight.weight}
            <span className="ml-1 text-sm font-normal text-black/40 dark:text-white/40">{currentWeight.unit}</span>
          </p>
          <p className="mt-0.5 text-xs text-black/40 dark:text-white/40">
            {goalWeightKg !== null && goalProgressPct !== null
              ? `Goal ${goalWeightKg} kg · ${Math.round(goalProgressPct)}% there`
              : "No goal weight set"}
          </p>

          {sparkData.length >= 2 && (
            <div className="mt-2 h-9 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkData}>
                  <Line type="monotone" dataKey="value" stroke={COLOR} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="mt-1.5 flex items-center justify-between gap-2">
            {periodDelta !== null ? (
              <span
                className={`flex items-center gap-1 text-xs font-medium ${
                  periodDelta === 0 || movedTowardGoal === null
                    ? "text-black/45 dark:text-white/45"
                    : movedTowardGoal
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {periodDelta !== 0 && movedTowardGoal !== null && (movedTowardGoal ? <ArrowDown size={11} /> : <ArrowUp size={11} />)}
                {periodDelta === 0 ? "No change this period" : `${periodDelta > 0 ? "+" : ""}${periodDelta} ${currentWeight.unit} this period`}
              </span>
            ) : (
              <span className="text-xs text-black/35 dark:text-white/35">Not logged this period</span>
            )}

            {bmiCategory && (
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: `${bmiCategory.color}1F`, color: bmiCategory.color }}
              >
                BMI {bmi!.toFixed(1)} · {bmiCategory.label}
              </span>
            )}
          </div>
        </>
      ) : (
        <p className="text-xs text-black/40 dark:text-white/40">No weight logged yet.</p>
      )}
    </Link>
  );
}
