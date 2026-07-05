import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="glass-card flex flex-col items-center gap-3 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
        <Icon size={22} className="text-emerald-600 dark:text-emerald-400" />
      </div>
      <h2 className="font-display text-base font-medium text-ink dark:text-cream-100">{title}</h2>
      <p className="max-w-xs text-sm text-black/50 dark:text-white/50">{description}</p>
    </div>
  );
}
