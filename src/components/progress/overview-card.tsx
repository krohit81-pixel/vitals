"use client";

import Link from "next/link";
import { ArrowUp, ArrowDown, Minus, ChevronRight } from "lucide-react";

export function OverviewCard({
  title,
  icon,
  value,
  unit,
  comparisonLabel,
  comparisonDirection,
  visual,
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
  /** Pre-rendered ring/donut, e.g. <MiniRing percent={72} color="#10B981" /> — optional, since not every card has a meaningful 0-100 progress to show (Heart rate has no "goodness" percentage without edging into medical judgment). */
  visual?: React.ReactNode;
  color: string;
  href: string;
}) {
  const DeltaIcon = comparisonDirection === "up" ? ArrowUp : comparisonDirection === "down" ? ArrowDown : Minus;

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

        {visual && <div className="shrink-0">{visual}</div>}
      </div>
    </Link>
  );
}
