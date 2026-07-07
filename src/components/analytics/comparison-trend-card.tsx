"use client";

import { Bar, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { parseDateString } from "@/lib/nutrition/date";

export interface ComparisonSeries {
  label: string;
  color: string;
  data: Array<{ date: string; value: number }>;
}

export function ComparisonTrendCard({
  title,
  unit,
  series,
}: {
  title: string;
  unit: string;
  /** Exactly two series, sharing the same dates — e.g. Consumed vs Burned. */
  series: [ComparisonSeries, ComparisonSeries];
}) {
  // Net = first series minus second (e.g. Consumed − Burned) — shown as a
  // line overlaid on the two bars, so each day shows all three numbers at
  // once: consumed, burned, and the resulting total.
  const merged = series[0].data.map((point, i) => ({
    date: point.date,
    [series[0].label]: point.value,
    [series[1].label]: series[1].data[i]?.value ?? 0,
    Net: point.value - (series[1].data[i]?.value ?? 0),
  }));

  return (
    <Card>
      <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
        {title}
      </p>

      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={merged} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) =>
                parseDateString(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })
              }
              interval="preserveStartEnd"
              tick={{ fontSize: 10, fill: "currentColor", opacity: 0.4 }}
              axisLine={false}
              tickLine={false}
              minTickGap={20}
            />
            <YAxis hide />

            <Tooltip
              formatter={(value: number, name: string) => [`${Math.round(value)} ${unit}`, name]}
              labelFormatter={(d: string) => parseDateString(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
              contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 30px -6px rgba(0,0,0,0.15)", fontSize: 12 }}
            />

            <Legend wrapperStyle={{ fontSize: 11, opacity: 0.6 }} iconType="circle" iconSize={6} />

            <Bar dataKey={series[0].label} fill={series[0].color} radius={[4, 4, 0, 0]} maxBarSize={16} />
            <Bar dataKey={series[1].label} fill={series[1].color} radius={[4, 4, 0, 0]} maxBarSize={16} />
            <Line
              type="monotone"
              dataKey="Net"
              stroke="#26251F"
              strokeWidth={2}
              dot={{ r: 2.5 }}
              strokeOpacity={0.6}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
