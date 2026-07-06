import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Watch } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { LocalTime } from "@/components/shared/local-time";
import { WorkoutForm } from "@/components/workouts/workout-form";
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPE_ICONS, type WorkoutType } from "@/lib/nutrition/workout-type";
import { updateWorkoutAction } from "../actions";
import { DeleteWorkoutButton } from "./delete-workout-button";

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: workout } = await supabase
    .from("workout_logs")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!workout) notFound();

  const Icon = WORKOUT_TYPE_ICONS[workout.workout_type as WorkoutType];
  const isManual = workout.source === "manual";
  const boundUpdate = updateWorkoutAction.bind(null, workout.id);

  return (
    <div className="animate-fade-up space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/meals"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <Icon size={18} className="text-emerald-600 dark:text-emerald-400" />
            <span className="font-display text-lg font-semibold text-ink dark:text-cream-100">
              {WORKOUT_TYPE_LABELS[workout.workout_type as WorkoutType]}
            </span>
          </div>
        </div>
        <DeleteWorkoutButton workoutId={workout.id} />
      </div>

      {!isManual && (
        <Card className="flex items-center gap-2 text-sm text-black/60 dark:text-white/60">
          <Watch size={16} className="text-black/40 dark:text-white/40" />
          Synced from Apple Health — edit details in the Health app; changes sync back here on next sync.
        </Card>
      )}

      {isManual ? (
        <WorkoutForm
          action={boundUpdate}
          defaults={{
            workout_type: workout.workout_type,
            date: workout.date,
            start_time: workout.start_time.slice(0, 5),
            duration_minutes: workout.duration_minutes,
            calories_burned: Math.round(Number(workout.calories_burned)),
            notes: workout.notes,
          }}
          submitLabel="Save changes"
        />
      ) : (
        <Card solid className="grid grid-cols-3 gap-3 text-center">
          <Stat label="minutes" value={workout.duration_minutes} />
          <Stat label="kcal burned" value={Math.round(Number(workout.calories_burned))} />
          <Stat label="started" value={<LocalTime iso={`${workout.date}T${workout.start_time}`} />} />
        </Card>
      )}

      {!isManual && workout.notes && (
        <Card>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-black/40 dark:text-white/40">Notes</p>
          <p className="text-sm text-black/70 dark:text-white/70">{workout.notes}</p>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="font-display text-base font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] text-black/45 dark:text-white/45">{label}</p>
    </div>
  );
}
