"use client";

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { average } from "@/lib/nutrition/consistency";
import { parseDateString } from "@/lib/nutrition/date";

const COLORS = { fat: "#F59E0B", carbs: "#3B82F6", protein: "#10B981" };

export interface MacroDayPoint {
  date: string;
  fatG: number;
  carbsG: number;
  proteinG: number;
}

export function MacroSplitCard({ data }: { data: MacroDayPoint[] }) {
  const avgFat = average(data.map((d) => d.fatG));
  const avgCarbs = average(data.map((d) => d.carbsG));
  const avgProtein = average(data.map((d) => d.proteinG));
  const total = avgFat + avgCarbs + avgProtein || 1;

  const pct = {
    fat: Math.round((avgFat / total) * 100),
    carbs: Math.round((avgCarbs / total) * 100),
    protein: Math.round((avgProtein / total) * 100),
  };

  const pieData = [
    { name: "Fat", value: avgFat, color: COLORS.fat },
    { name: "Carbs", value: avgCarbs, color: COLORS.carbs },
    { name: "Protein", value: avgProtein, color: COLORS.protein },
  ];

  return (
    <Card>
      <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
        Macro Split
      </p>

      <div className="flex items-center gap-4">
        <div className="h-24 w-24 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" innerRadius={28} outerRadius={44} strokeWidth={0}>
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${Math.round(value)}g`, name]}
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 30px -6px rgba(0,0,0,0.15)", fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-1.5">
          <LegendRow color={COLORS.fat} label="Fat" pct={pct.fat} />
          <LegendRow color={COLORS.carbs} label="Carbs" pct={pct.carbs} />
          <LegendRow color={COLORS.protein} label="Protein" pct={pct.protein} />
        </div>
      </div>

      <div className="mt-4 h-24 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) =>
                parseDateString(d).toLocaleDateString(undefined, { weekday: "narrow" })
              }
              tick={{ fontSize: 10, fill: "currentColor", opacity: 0.4 }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <Bar dataKey="fatG" stackId="macro" fill={COLORS.fat} radius={[0, 0, 0, 0]} maxBarSize={20} />
            <Bar dataKey="carbsG" stackId="macro" fill={COLORS.carbs} radius={[0, 0, 0, 0]} maxBarSize={20} />
            <Bar dataKey="proteinG" stackId="macro" fill={COLORS.protein} radius={[4, 4, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function LegendRow({ color, label, pct }: { color: string; label: string; pct: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="font-medium tabular-nums">{pct}%</span>
    </div>
  );
}
