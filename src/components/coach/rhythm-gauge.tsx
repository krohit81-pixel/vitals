import type { RhythmScore } from "@/lib/nutrition/coach-insights";

export function RhythmGauge({ rhythm }: { rhythm: RhythmScore }) {
  const size = 88;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(rhythm.score / 100, 1);

  const color = rhythm.score >= 85 ? "#10B981" : rhythm.score >= 65 ? "#3B82F6" : "#F59E0B";

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} className="fill-none stroke-black/[0.06] dark:stroke-white/[0.08]" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            strokeLinecap="round"
            stroke={color}
            className="fill-none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-xl font-bold tabular-nums text-ink dark:text-cream-100">
            {rhythm.score}
          </span>
        </div>
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
          This week&apos;s rhythm
        </p>
        <p className="font-display text-lg font-semibold text-ink dark:text-cream-100">{rhythm.label}</p>
      </div>
    </div>
  );
}
