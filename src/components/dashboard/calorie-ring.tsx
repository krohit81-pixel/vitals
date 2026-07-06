"use client";

import { motion } from "framer-motion";

export function CalorieRing({
  consumed,
  target,
  burned = 0,
}: {
  consumed: number;
  target: number;
  /** Exercise calories burned — added to target per the energy balance formula:
   *  Remaining = Target + Burned − Consumed. Defaults to 0 so this stays a
   *  drop-in replacement wherever burned isn't tracked (e.g. no workouts yet). */
  burned?: number;
}) {
  const adjustedTarget = target + burned;
  const remaining = Math.max(adjustedTarget - consumed, 0);
  const pct = Math.min(consumed / adjustedTarget, 1);

  const size = 220;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center py-4">
      {/* Sized exactly to the ring, holding only the SVG + overlay — keeps the
          text centered on the ring regardless of what renders below it. */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            className="fill-none stroke-black/[0.05] dark:stroke-white/[0.06]"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            strokeLinecap="round"
            className="fill-none stroke-emerald-500"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - pct) }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-semibold tabular-nums text-ink dark:text-cream-100">
            {remaining.toLocaleString()}
          </span>
          <span className="text-sm text-black/50 dark:text-white/50">calories remaining</span>
        </div>
      </div>

      <div className="mt-5 flex w-full justify-between px-2 text-center">
        <Stat label="Consumed" value={consumed} />
        <Stat label="Burned" value={burned} />
        <Stat label="Remaining" value={remaining} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="font-display text-lg font-medium tabular-nums">{value.toLocaleString()}</span>
      <span className="text-xs text-black/45 dark:text-white/45">{label}</span>
    </div>
  );
}
