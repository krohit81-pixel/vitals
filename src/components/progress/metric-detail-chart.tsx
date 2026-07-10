"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { parseDateString } from "@/lib/nutrition/date";

export function MetricDetailChart({
  data,
  color,
  unit,
}: {
  data: Array<{ date: string; value: number }>;
  color: string;
  unit: string;
}) {
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
          <YAxis tick={{ fontSize: 11, fill: "currentColor", opacity: 0.4 }} axisLine={false} tickLine={false} width={36} />
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
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
