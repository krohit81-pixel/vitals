"use client";

import Link from "next/link";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ArrowUp, ArrowDown, Minus, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export function OverviewCard({
  title,
  icon,
  value,
  unit,
  comparisonLabel,
  comparisonDirection,
  sparkline,
  color,
  href,
}: {
  title: string;
  /** Pre-rendered icon element — see InsightCard's comments on why this can't be a component reference across the Server/Client boundary. */
  icon: React.ReactNode;
  value: string;
  unit?: string;
  comparisonLabel: string | null;
  comparisonDirection: "up" | "down" | "flat" | null;
  sparkline: number[];
  color: string;
  href: string;
}) {
  const DeltaIcon = comparisonDirection === "up" ? ArrowUp : comparisonDirection === "down" ? ArrowDown : Minus;
  const data = sparkline.map((v, i) => ({ i, value: v }));

  return (
    <Link href={href} className="pressable glass-card block p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: `${color}22` }}>
            {icon}
          </div>
          <span className="text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
            {title}
          </span>
        </div>
        <ChevronRight size={15} className="text-black/25 dark:text-white/25" />
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="font-display text-2xl font-bold tabular-nums text-ink dark:text-cream-100">
            {value}
            {unit && <span className="ml-1 text-sm font-normal text-black/40 dark:text-white/40">{unit}</span>}
          </p>
          {comparisonLabel && (
            <p
              className={`mt-0.5 flex items-center gap-1 text-xs font-medium ${
                comparisonDirection === "up"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : comparisonDirection === "down"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-black/40 dark:text-white/40"
              }`}
            >
              <DeltaIcon size={11} />
              {comparisonLabel}
            </p>
          )}
        </div>

        <div className="h-10 w-20 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`fill-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.75} fill={`url(#fill-${title})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Link>
  );
}
