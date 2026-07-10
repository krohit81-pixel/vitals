"use client";

import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

export function HealthScoreRing({ score, deltaVsPrevious }: { score: number; deltaVsPrevious: number | null }) {
  const size = 168;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(score / 100, 0), 1);

  const color = score >= 80 ? "#10B981" : score >= 55 ? "#3B82F6" : "#F59E0B";
  const DeltaIcon = deltaVsPrevious === null || deltaVsPrevious === 0 ? Minus : deltaVsPrevious > 0 ? ArrowUp : ArrowDown;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90 drop-shadow-[0_4px_16px_rgba(16,185,129,0.2)]">
          <defs>
            <linearGradient id="health-score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6EE7B7" />
              <stop offset="55%" stopColor={color} />
              <stop offset="100%" stopColor="#047857" />
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
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-bold tabular-nums text-ink dark:text-cream-100">{score}</span>
          <span className="text-xs text-black/40 dark:text-white/40">/ 100</span>
        </div>
      </div>

      {deltaVsPrevious !== null && (
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
          {Math.abs(deltaVsPrevious)} vs last period
        </div>
      )}
    </div>
  );
}
