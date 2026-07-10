import Link from "next/link";
import { ArrowLeft, ArrowDown, ArrowUp, Scale } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { LocalDateTime } from "@/components/shared/local-time";
import { EmptyState } from "@/components/shared/empty-state";

export default async function WeightHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: logs } = await supabase
    .from("weight_logs")
    .select("id, weight, unit, measured_at, notes")
    .eq("user_id", user!.id)
    .order("measured_at", { ascending: false });

  const entries = logs ?? [];
  const current = entries[0];
  const previous = entries[1];
  const diff = current && previous ? current.weight - previous.weight : null;

  return (
    <div className="animate-fade-up space-y-5 pb-8">
      <div className="flex items-center gap-3">
        <Link href="/progress" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-display text-xl font-semibold text-ink dark:text-cream-100">Weight</h1>
      </div>

      {current && (
        <Card solid className="flex flex-col items-center gap-1 py-6">
          <span className="font-display text-4xl font-bold tabular-nums text-ink dark:text-cream-100">
            {current.weight} <span className="text-lg font-medium text-black/40 dark:text-white/40">{current.unit}</span>
          </span>
          {diff !== null && (
            <span
              className={`flex items-center gap-1 text-sm font-medium ${diff <= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}
            >
              {diff <= 0 ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
              {Math.abs(diff).toFixed(1)} {current.unit} since last
            </span>
          )}
        </Card>
      )}

      {entries.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="No weight logged yet"
          description="Tap the + button and choose Log Weight to add your first entry."
        />
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <Link key={e.id} href={`/weight/${e.id}`} className="pressable glass-card flex items-center justify-between p-3.5">
              <div>
                <p className="font-display text-sm font-semibold tabular-nums">
                  {e.weight} {e.unit}
                </p>
                {e.notes && <p className="text-xs text-black/45 dark:text-white/45">{e.notes}</p>}
              </div>
              <LocalDateTime iso={e.measured_at} className="text-xs text-black/40 dark:text-white/40" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
