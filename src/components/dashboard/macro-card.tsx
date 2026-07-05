import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function MacroCard({
  icon: Icon,
  label,
  current,
  target,
  unit,
  colorClass = "bg-emerald-500",
}: {
  icon: LucideIcon;
  label: string;
  current: number;
  target: number;
  unit: string;
  colorClass?: string;
}) {
  const pct = Math.min((current / target) * 100, 100);

  return (
    <div className="glass-card flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", colorClass, "bg-opacity-15")}>
          <Icon size={16} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-black/[0.05] dark:bg-white/[0.08]">
        <div
          className={cn("h-full rounded-full transition-all duration-700", colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-baseline gap-1 text-xs text-black/50 dark:text-white/50">
        <span className="font-semibold text-ink dark:text-cream-100">{current}</span>
        <span>/ {target}{unit}</span>
      </div>
    </div>
  );
}
