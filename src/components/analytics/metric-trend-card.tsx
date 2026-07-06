"use client";

import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis } from "recharts";
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
  /** Daily target, if this metric has one — drives the reference line and consistency badge. */
  target?: number;
  /** Override how the KPI number is displayed, e.g. rounding differently per metric. */
  formatValue?: (value: number) => string;
}

const defaultFormat = (v: number) => Math.round(v).toLocaleString();

export function MetricTrendCard({
  label,
  unit,
  color,
  data,
  target,
  formatValue = defaultFormat,
}: MetricTrendCardProps) {
  const values = data.map((d) => d.value);
  const avg = average(values);
  const consistency = target ? calcConsistency(values, target) : undefined;
  const showDailyTicks = data.length <= 8;

  return (
    <Card>
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
            {label}
          </p>
          <p className="font-display text-xl font-semibold tabular-nums text-ink dark:text-cream-100">
            {formatValue(avg)}
            <span className="ml-1 text-xs font-normal text-black/40 dark:text-white/40">
              {unit} avg/day
            </span>
          </p>
        </div>

        {consistency !== undefined && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium",
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
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id={`fill-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>

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
              <ReferenceLine
                y={target}
                stroke={color}
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
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

            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#fill-${label})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
