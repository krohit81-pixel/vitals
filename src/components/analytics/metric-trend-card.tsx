"use client";

import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { average, calcConsistency } from "@/lib/nutrition/consistency";
import { parseDateString } from "@/lib/nutrition/date";
import { cn } from "@/lib/utils";

export interface MetricPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

export interface MetricTrendCardProps {
  label: string;
  unit: string;
  /** Tailwind-adjacent hex so the chart matches the app's palette exactly. */
  color: string;
  data: MetricPoint[];
  /** Daily target, if this metric has one — drives the reference line, the
   * Under/Over headline, and per-bar shading. */
  target?: number;
  /**
   * How to display the KPI number. A string, not a function — this component
   * is rendered from Server Components (Dashboard), and Next.js can't pass a
   * plain function across that boundary (only Server Actions can cross it).
   * Defaults to whole-number formatting.
   */
  format?: "integer" | "oneDecimal";
}

const FORMATTERS: Record<NonNullable<MetricTrendCardProps["format"]>, (v: number) => string> = {
  integer: (v) => Math.round(v).toLocaleString(),
  oneDecimal: (v) => v.toFixed(1),
};

export function MetricTrendCard({
  label,
  unit,
  color,
  data,
  target,
  format = "integer",
}: MetricTrendCardProps) {
  const formatValue = FORMATTERS[format];
  const values = data.map((d) => d.value);
  const avg = average(values);
  const consistency = target ? calcConsistency(values, target) : undefined;
  const showDailyTicks = data.length <= 8;

  // Under/Over framing, mirroring a budget-style gauge: how far the average
  // sits from target, in whichever direction — not a good/bad judgement
  // (protein "over" is fine), just a plain descriptive delta.
  const diff = target ? target - avg : null;
  const diffLabel = diff === null ? null : diff >= 0 ? "under" : "over";

  return (
    <Card>
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
            {label}
          </p>
          {diff !== null ? (
            <>
              <p className="font-display text-2xl font-bold tabular-nums" style={{ color }}>
                {formatValue(Math.abs(diff))}
                <span className="ml-1.5 text-sm font-medium capitalize" style={{ color }}>
                  {diffLabel}
                </span>
              </p>
              <p className="text-xs text-black/40 dark:text-white/40">
                {formatValue(avg)} of {formatValue(target!)} {unit} avg/day
              </p>
            </>
          ) : (
            <p className="font-display text-xl font-semibold tabular-nums text-ink dark:text-cream-100">
              {formatValue(avg)}
              <span className="ml-1 text-xs font-normal text-black/40 dark:text-white/40">
                {unit} avg/day
              </span>
            </p>
          )}
        </div>

        {consistency !== undefined && (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
              consistency >= 70
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
            )}
          >
            {consistency}% consistent
          </span>
        )}
      </div>

      <div className="h-28 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) =>
                parseDateString(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })
              }
              interval={showDailyTicks ? 0 : "preserveStartEnd"}
              tick={{ fontSize: 10, fill: "currentColor", opacity: 0.4 }}
              axisLine={false}
              tickLine={false}
              minTickGap={20}
            />

            {target && (
              <ReferenceLine y={target} stroke={color} strokeDasharray="4 4" strokeOpacity={0.5} />
            )}

            <Tooltip
              formatter={(value: number) => [`${formatValue(value)} ${unit}`, label]}
              labelFormatter={(d: string) => parseDateString(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
              contentStyle={{
                borderRadius: 12,
                border: "none",
                boxShadow: "0 8px 30px -6px rgba(0,0,0,0.15)",
                fontSize: 12,
              }}
            />

            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={28}>
              {data.map((d, i) => (
                <Cell key={i} fill={color} fillOpacity={target && d.value > target ? 1 : 0.55} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
