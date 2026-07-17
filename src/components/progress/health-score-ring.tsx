"use client";

import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

export function HealthScoreRing({
  score,
  deltaVsPrevious,
  previousPeriodLabel,
}: {
  score: number;
  /** null when the previous period has no real data to compare against —
   * showing a delta then would be misleading (it'd just equal the current
   * score, since "vs zero" isn't a real comparison). */
  deltaVsPrevious: number | null;
  /** e.g. "Jun 27 – Jul 3" — always shown so it's clear what's being compared,
   * even when there's no delta to show yet. */
  previousPeriodLabel: string;
}) {
  const size = 176;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(score / 100, 0), 1);

  const tier = score >= 80 ? "high" : score >= 55 ? "mid" : "low";
  const thumbColor = tier === "high" ? "#10B981" : tier === "mid" ? "#3B82F6" : "#F59E0B";
  const glow =
    tier === "high"
      ? "drop-shadow(0 6px 24px rgba(16,185,129,0.4))"
      : tier === "mid"
        ? "drop-shadow(0 6px 24px rgba(59,130,246,0.4))"
        : "drop-shadow(0 6px 24px rgba(245,158,11,0.4))";

  const DeltaIcon = deltaVsPrevious === null || deltaVsPrevious === 0 ? Minus : deltaVsPrevious > 0 ? ArrowUp : ArrowDown;

  const thumbAngle = pct * 2 * Math.PI;
  const thumbX = size / 2 + radius * Math.cos(thumbAngle);
  const thumbY = size / 2 + radius * Math.sin(thumbAngle);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" style={{ filter: glow }}>
          <defs>
            <linearGradient id="health-score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A78BFA" />
              <stop offset="45%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#0EA5E9" />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} className="fill-none stroke-black/[0.05] dark:stroke-white/[0.07]" />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            strokeLinecap="round"
            stroke="url(#health-score-gradient)"
            className="fill-none"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - pct) }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          />
          {pct > 0.02 && (
            <motion.circle
              r={9}
              fill={thumbColor}
              stroke="white"
              strokeWidth={2.5}
              className="dark:stroke-graphite-50"
              initial={{ cx: size / 2 + radius, cy: size / 2 }}
              animate={{ cx: thumbX, cy: thumbY }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.3))" }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-[2.75rem] font-extrabold leading-none tabular-nums text-ink dark:text-cream-100">{score}</span>
          <span className="mt-1 text-xs text-black/40 dark:text-white/40">/ 100</span>
        </div>
      </div>

      {deltaVsPrevious !== null ? (
        <div
          className={`mt-2 flex items-center gap-1 text-sm font-medium ${
            deltaVsPrevious > 0
              ? "text-emerald-600 dark:text-emerald-400"
              : deltaVsPrevious < 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-black/40 dark:text-white/40"
          }`}
        >
          <DeltaIcon size={14} />
          {Math.abs(deltaVsPrevious)} vs {previousPeriodLabel}
        </div>
      ) : (
        <p className="mt-2 text-xs text-black/35 dark:text-white/35">
          Not enough data yet in {previousPeriodLabel} to compare
        </p>
      )}
    </div>
  );
}
