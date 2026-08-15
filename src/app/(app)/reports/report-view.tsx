"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Printer, RefreshCw, Flame, Dumbbell, Zap } from "lucide-react";
import { ScoreBreakdown, type ScoreBreakdownItem } from "@/components/progress/score-breakdown";
import { LoadingRing } from "@/components/shared/loading-ring";
import { Button } from "@/components/ui/button";
import { generateWeeklyReportAction } from "./actions";

export interface WeeklyReportStats {
  avgCalories: number;
  totalWorkouts: number;
  streak: number;
}

export function ReportView({
  weekStart,
  weekEnd,
  weekLabel,
  focusAreas,
  accomplishments,
  upcomingFocus,
  stats,
  initialGeneratedAt,
}: {
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  focusAreas: ScoreBreakdownItem[];
  accomplishments: string[];
  upcomingFocus: string;
  stats: WeeklyReportStats;
  initialGeneratedAt: string | null;
}) {
  const [pending, startTransition] = useTransition();
  // Updates immediately on a successful Generate, without waiting for the
  // server-revalidated prop to round-trip back down.
  const [generatedAt, setGeneratedAt] = useState<string | null>(initialGeneratedAt);

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await generateWeeklyReportAction({ weekStart, weekEnd, focusAreas, accomplishments, upcomingFocus });
      setGeneratedAt(result.generated_at);
    });
  };

  return (
    <div className="space-y-4">
      {/* Actions — never part of the printed page */}
      <div className="flex items-center gap-2 print:hidden">
        <Button onClick={handleGenerate} disabled={pending} className="flex-1">
          {pending ? <LoadingRing size={15} className="text-white" /> : <RefreshCw size={15} />}
          {generatedAt ? "Regenerate report" : "Generate report"}
        </Button>
        <Button onClick={() => window.print()} variant="outline" size="icon" aria-label="Save as PDF">
          <Printer size={17} />
        </Button>
      </div>

      {generatedAt && (
        <p className="text-xs text-black/40 dark:text-white/40 print:hidden">
          Last generated {new Date(generatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
        </p>
      )}

      {/* Printable report */}
      <div className="glass-card space-y-5 p-5 print:border print:border-black/10 print:bg-white print:text-black print:shadow-none">
        <header className="hidden print:block">
          <h1 className="font-display text-xl font-semibold">Vitals — Weekly Report</h1>
          <p className="text-sm text-black/60">{weekLabel}</p>
        </header>

        <div className="grid grid-cols-3 gap-3">
          <StatChip icon={<Flame size={14} />} label="Avg calories" value={Math.round(stats.avgCalories).toLocaleString()} />
          <StatChip icon={<Dumbbell size={14} />} label="Workouts" value={String(stats.totalWorkouts)} />
          <StatChip icon={<Zap size={14} />} label="Streak" value={`${stats.streak}d`} />
        </div>

        <section>
          <h2 className="mb-3 text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40 print:text-black/60">
            Focus areas this week
          </h2>
          {focusAreas.length > 0 ? (
            <ScoreBreakdown items={focusAreas} />
          ) : (
            <p className="text-sm text-black/45 dark:text-white/45 print:text-black/60">
              Nothing logged this week yet — focus areas show up once you log meals, water, or workouts.
            </p>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40 print:text-black/60">
            Accomplishments
          </h2>
          {accomplishments.length > 0 ? (
            <ul className="space-y-2">
              {accomplishments.map((label) => (
                <li key={label} className="flex items-center gap-2 text-sm text-ink dark:text-cream-100 print:text-black">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400 print:text-black" />
                  {label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-black/45 dark:text-white/45 print:text-black/60">
              No milestones hit this week — see Focus Areas above for where to aim.
            </p>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40 print:text-black/60">
            Focus for next week
          </h2>
          <p className="text-sm leading-relaxed text-ink dark:text-cream-100 print:text-black">{upcomingFocus}</p>
        </section>
      </div>
    </div>
  );
}

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/[0.03] p-3 text-center dark:bg-white/[0.04] print:border print:border-black/10 print:bg-white">
      <div className="mb-1 flex items-center justify-center gap-1 text-black/40 dark:text-white/40 print:text-black/50">
        {icon}
      </div>
      <p className="font-display text-base font-semibold text-ink dark:text-cream-100 print:text-black">{value}</p>
      <p className="text-[10px] text-black/40 dark:text-white/40 print:text-black/50">{label}</p>
    </div>
  );
}
