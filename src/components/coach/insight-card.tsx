"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { TrendDirection } from "@/lib/nutrition/coach-insights";

const TREND_ICONS: Record<TrendDirection, LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

export function InsightCard({
  icon: Icon,
  label,
  headline,
  sparkline,
  color,
  trend,
}: {
  icon: LucideIcon;
  label: string;
  headline: string;
  sparkline: number[];
  color: string;
  trend?: TrendDirection;
}) {
  const TrendIcon = trend ? TREND_ICONS[trend] : null;
  const data = sparkline.map((value, i) => ({ i, value }));

  return (
    <div className="glass-card flex w-40 shrink-0 flex-col gap-2 p-3.5">
      <div className="flex items-center justify-between">
        <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: `${color}22` }}>
          <Icon size={14} style={{ color }} />
        </div>
        {TrendIcon && <TrendIcon size={13} className="text-black/30 dark:text-white/30" />}
      </div>

      <p className="text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
        {label}
      </p>
      <p className="font-display text-sm font-semibold leading-snug text-ink dark:text-cream-100">
        {headline}
      </p>

      <div className="h-8 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
