"use client";

import Link from "next/link";
import { HeartPulse, ArrowUp, ArrowDown, Minus, ChevronRight } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import type { DailyMetricPoint } from "@/lib/nutrition/get-health-metrics";

const COLOR = "#EF4444";
/** Ignore noise under ~3% — resting heart rate moves in a narrow band, so
 * the 8%-of-value threshold used for looser metrics elsewhere would almost
 * never fire here. */
const NOISE_FLOOR_BPM = 1;

/** Fixes the original bug where the trend arrow and the trend text were
 * computed from two different (and inconsistently inverted) values — this
 * derives both from one first-half-vs-second-half comparison, so they can
 * never disagree with each other again. */
export function HeartRateCard({ series }: { series: DailyMetricPoint[] }) {
  const readings = series.filter((p) => p.value > 0);

  if (readings.length === 0) {
    return (
      <Link href="/progress/metric/heart_rate" className="pressable glass-card block p-4">
        <CardHeader />
        <p className="mt-2 text-xs text-black/40 dark:text-white/40">
          No resting heart rate data this period.
        </p>
      </Link>
    );
  }

  const values = readings.map((r) => r.value);
  const avg = Math.round(values.reduce((s, v) => s + v, 0) / values.length);
  const min = Math.round(Math.min(...values));
  const max = Math.round(Math.max(...values));

  const hasEnoughForTrend = readings.length >= 4;
  let trendDirection: "up" | "down" | "flat" | null = null;
  let trendDeltaBpm = 0;
  if (hasEnoughForTrend) {
    const mid = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, mid).reduce((s, v) => s + v, 0) / mid;
    const secondHalf = values.slice(mid).reduce((s, v) => s + v, 0) / (values.length - mid);
    const delta = secondHalf - firstHalf;
    trendDeltaBpm = Math.round(Math.abs(delta));
    trendDirection = delta > NOISE_FLOOR_BPM ? "up" : delta < -NOISE_FLOOR_BPM ? "down" : "flat";
  }

  // Lower resting heart rate is generally the favorable direction, unlike
  // most "up is good" metrics — so the color mapping is intentionally
  // reversed from e.g. steps or protein.
  const trendColor =
    trendDirection === "down"
      ? "text-emerald-600 dark:text-emerald-400"
      : trendDirection === "up"
        ? "text-amber-600 dark:text-amber-400"
        : "text-black/40 dark:text-white/40";
  const TrendIcon = trendDirection === "up" ? ArrowUp : trendDirection === "down" ? ArrowDown : Minus;

  const sparkData = readings.map((r, i) => ({ i, value: r.value }));

  return (
    <Link href="/progress/metric/heart_rate" className="pressable glass-card block p-4">
      <CardHeader />
      <p className="font-display text-2xl font-bold tabular-nums text-ink dark:text-cream-100">
        {avg}
        <span className="ml-1 text-sm font-normal text-black/40 dark:text-white/40">bpm avg</span>
      </p>
      <p className="mt-0.5 text-xs text-black/40 dark:text-white/40">
        Range {min}–{max} bpm
      </p>

      {readings.length >= 2 && (
        <div className="mt-2 h-9 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line type="monotone" dataKey="value" stroke={COLOR} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {hasEnoughForTrend ? (
        <p className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${trendColor}`}>
          <TrendIcon size={11} />
          {trendDirection === "flat" ? "Stable" : `Trending ${trendDirection} ${trendDeltaBpm} bpm`}
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-black/35 dark:text-white/35">
          Log a few more readings to see a trend.
        </p>
      )}
    </Link>
  );
}

function CardHeader() {
  return (
    <div className="mb-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: `${COLOR}22` }}>
          <HeartPulse size={14} style={{ color: COLOR }} />
        </div>
        <span className="text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
          Resting heart rate
        </span>
      </div>
      <ChevronRight size={15} className="text-black/25 dark:text-white/25" />
    </div>
  );
}
