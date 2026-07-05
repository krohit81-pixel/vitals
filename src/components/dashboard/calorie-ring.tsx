"use client";

import { motion } from "framer-motion";

export function CalorieRing({
  consumed,
  target,
}: {
  consumed: number;
  target: number;
}) {
  const remaining = Math.max(target - consumed, 0);
  const pct = Math.min(consumed / target, 1);

  const size = 220;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative flex flex-col items-center justify-center py-4">
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

      <div className="absolute flex flex-col items-center">
        <span className="font-display text-4xl font-semibold tabular-nums text-ink dark:text-cream-100">
          {remaining.toLocaleString()}
        </span>
        <span className="text-sm text-black/50 dark:text-white/50">calories remaining</span>
      </div>

      <div className="mt-5 flex w-full justify-between px-2 text-center">
        <Stat label="Consumed" value={consumed} />
        <Stat label="Target" value={target} />
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
