"use client";

import { motion } from "framer-motion";
import { Flame, Zap, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const APPROACHING_THRESHOLD = 200; // kcal left before the ring warns amber

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
  // Not clamped to 0 — going over needs to actually show by how much, not
  // just disappear into "0 remaining."
  const remaining = adjustedTarget - consumed;
  const isOver = remaining < 0;
  const isApproaching = !isOver && remaining <= APPROACHING_THRESHOLD;
  const displayValue = Math.abs(remaining);
  const pct = Math.min(consumed / adjustedTarget, 1);

  const size = 236;
  const stroke = 20;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const statusColor = isOver ? "#EF4444" : isApproaching ? "#F59E0B" : null; // null = normal gradient
  const remainingChipClass = isOver
    ? "bg-red-400/15 text-red-500"
    : isApproaching
      ? "bg-amber-400/15 text-amber-500"
      : "bg-emerald-400/15 text-emerald-500";

  return (
    <div className="flex flex-col items-center py-2">
      {/* Sized exactly to the ring, holding only the SVG + overlay — keeps the
          text centered on the ring regardless of what renders below it. */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className={cn(
            "-rotate-90",
            isOver
              ? "drop-shadow-[0_4px_16px_rgba(239,68,68,0.3)]"
              : isApproaching
                ? "drop-shadow-[0_4px_16px_rgba(245,158,11,0.3)]"
                : "drop-shadow-[0_4px_16px_rgba(16,185,129,0.25)]"
          )}
        >
          <defs>
            <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6EE7B7" />
              <stop offset="55%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>

          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            className="fill-none stroke-black/[0.05] dark:stroke-white/[0.07]"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            strokeLinecap="round"
            stroke={statusColor ?? "url(#ring-gradient)"}
            className="fill-none"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - pct) }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span
            className="font-display text-[2.75rem] leading-none font-bold tabular-nums"
            style={{ color: statusColor ?? undefined }}
          >
            {displayValue.toLocaleString()}
          </span>
          <span className="text-[13px] font-medium text-black/45 dark:text-white/45">
            kcal {isOver ? "over" : "remaining"}
          </span>
        </div>
      </div>

      <div className="mt-6 flex w-full items-stretch justify-center gap-2">
        <RingStat icon={Flame} label="Consumed" value={consumed} colorClass="bg-amber-400/15 text-amber-500" />
        <Divider />
        <RingStat icon={Zap} label="Burned" value={burned} colorClass="bg-sky-400/15 text-sky-500" />
        <Divider />
        <RingStat
          icon={Target}
          label={isOver ? "Over" : "Remaining"}
          value={displayValue}
          colorClass={remainingChipClass}
        />
      </div>
    </div>
  );
}

function Divider() {
  return <div className="w-px self-stretch bg-black/[0.06] dark:bg-white/[0.08]" />;
}

function RingStat({
  icon: Icon,
  label,
  value,
  colorClass,
}: {
  icon: typeof Flame;
  label: string;
  value: number;
  colorClass: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1.5 px-1">
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", colorClass)}>
        <Icon size={15} strokeWidth={2.25} />
      </div>
      <span className="font-display text-base font-semibold tabular-nums text-ink dark:text-cream-100">
        {value.toLocaleString()}
      </span>
      <span className="text-[11px] text-black/45 dark:text-white/45">{label}</span>
    </div>
  );
}
