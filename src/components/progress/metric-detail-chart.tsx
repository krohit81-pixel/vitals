"use client";

import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { parseDateString } from "@/lib/nutrition/date";

const GOAL_COLOR = "#10B981"; // emerald — same "target/on-track" color used everywhere else (Health Score, WeightCard's goal delta)

export function MetricDetailChart({
  data,
  color,
  unit,
  goalValue,
}: {
  data: Array<{ date: string; value: number }>;
  color: string;
  unit: string;
  /** Optional reference line (e.g. goal weight) — omit for metrics with no
   * target concept. Included in the axis's own min/max so it's never
   * clipped off-chart even when it's outside the logged data's range. */
  goalValue?: number | null;
}) {
  // Recharts' default YAxis domain is `[0, niceRoundMax]` — fine for a
  // metric that naturally spans that whole range, but it flattens anything
  // where the *meaningful* variation is small relative to the absolute
  // value (weight is the clearest case: an 85 → 84.1kg drop is a real,
  // decent result, but on a 0–100 axis it reads as a flat line hugging the
  // top). Zoom the axis to the actual data range instead, padded so the
  // line never touches the very top/bottom edge — this component is shared
  // by every metric detail chart (weight, steps, heart rate, HRV, …), so the
  // padding is relative (% of range) with an absolute floor for a
  // near-flat/single-point series, rather than anything weight-specific.
  const values = data.map((d) => d.value).filter((v) => Number.isFinite(v));
  const withGoal = goalValue != null && Number.isFinite(goalValue) ? [...values, goalValue] : values;
  const dataMin = withGoal.length > 0 ? Math.min(...withGoal) : 0;
  const dataMax = withGoal.length > 0 ? Math.max(...withGoal) : 1;
  const pad = Math.max((dataMax - dataMin) * 0.15, dataMax * 0.02, 0.5);
  const yDomain: [number, number] = [Math.max(0, dataMin - pad), dataMax + pad];
  const round1 = (v: number) => Math.round(v * 10) / 10;
  // Recharts' own "nice tick" generator (used when only `domain` is given)
  // produced garbage (repeated "9999" labels) against a tight, non-round
  // custom decimal domain like this one — a real bug hit in production.
  // Sidestepping it entirely by computing our own evenly-spaced ticks is
  // more robust than trying to coax their algorithm into behaving.
  const yTicks = Array.from({ length: 4 }, (_, i) => round1(yDomain[0] + ((yDomain[1] - yDomain[0]) * i) / 3));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="metric-detail-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis
            type="number"
            domain={yDomain}
            ticks={yTicks}
            tickFormatter={(v: number) => `${round1(v)}`}
            tick={{ fontSize: 11, fill: "currentColor", opacity: 0.4 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => parseDateString(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            interval="preserveStartEnd"
            tick={{ fontSize: 11, fill: "currentColor", opacity: 0.4 }}
            axisLine={false}
            tickLine={false}
            minTickGap={30}
          />
          <Tooltip
            formatter={(value: number) => [`${Math.round(value * 10) / 10} ${unit}`, ""]}
            labelFormatter={(d: string) => parseDateString(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 30px -6px rgba(0,0,0,0.15)", fontSize: 12 }}
          />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill="url(#metric-detail-fill)" />
          {goalValue != null && Number.isFinite(goalValue) && (
            <ReferenceLine y={goalValue} stroke={GOAL_COLOR} strokeWidth={1.5} strokeDasharray="4 4" />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
