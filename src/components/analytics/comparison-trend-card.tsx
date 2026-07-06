"use client";

import { Area, AreaChart, Legend, ResponsiveContainer, Tooltip, XAxis } from "recharts";
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
  const merged = series[0].data.map((point, i) => ({
    date: point.date,
    [series[0].label]: point.value,
    [series[1].label]: series[1].data[i]?.value ?? 0,
  }));

  return (
    <Card>
      <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
        {title}
      </p>

      <div className="h-36 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={merged} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <defs>
              {series.map((s) => (
                <linearGradient key={s.label} id={`fill-cmp-${s.label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>

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

            <Tooltip
              formatter={(value: number, name: string) => [`${Math.round(value)} ${unit}`, name]}
              labelFormatter={(d: string) => parseDateString(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
              contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 30px -6px rgba(0,0,0,0.15)", fontSize: 12 }}
            />

            <Legend
              wrapperStyle={{ fontSize: 11, opacity: 0.6 }}
              iconType="circle"
              iconSize={6}
            />

            {series.map((s) => (
              <Area
                key={s.label}
                type="monotone"
                dataKey={s.label}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#fill-cmp-${s.label})`}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
