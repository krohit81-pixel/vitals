import type { LucideIcon } from "lucide-react";

export function MacroCard({
  icon: Icon,
  label,
  current,
  target,
  unit,
  color = "#10B981",
}: {
  icon: LucideIcon;
  label: string;
  current: number;
  target: number;
  unit: string;
  /** Hex color — drives the icon, the fill, and the slider thumb together,
   * so a metric's color is fully consistent instead of the icon defaulting
   * to one fixed color regardless of which metric it's on. */
  color?: string;
}) {
  const pct = Math.min((current / target) * 100, 100);

  return (
    <div className="glass-card flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}1F` }}
        >
          <Icon size={16} style={{ color }} />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>

      <p className="font-display text-2xl font-bold tabular-nums text-ink dark:text-cream-100">
        {current.toLocaleString()}
        <span className="ml-1 text-xs font-normal text-black/40 dark:text-white/40">{unit}</span>
      </p>

      {/* Slider-style progress: a track, a colored fill, and a round thumb
          marking exactly where "current" sits — reads more like a live
          instrument than a plain static bar. */}
      <div className="relative h-2 w-full rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_1px_4px_rgba(0,0,0,0.25)] transition-all duration-700 dark:border-graphite-50"
          style={{ left: `calc(${pct}% - 7px)`, backgroundColor: color }}
        />
      </div>

      <p className="text-[11px] text-black/40 dark:text-white/40">
        Target: {target.toLocaleString()}{unit}
      </p>
    </div>
  );
}
