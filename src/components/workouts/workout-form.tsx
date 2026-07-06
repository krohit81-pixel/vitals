"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPES } from "@/lib/nutrition/workout-type";
import type { WorkoutFormState } from "@/app/(app)/workouts/actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function WorkoutForm({
  action,
  defaults,
  submitLabel = "Save workout",
}: {
  action: (state: WorkoutFormState, formData: FormData) => Promise<WorkoutFormState>;
  defaults?: {
    workout_type?: string;
    date?: string;
    start_time?: string;
    duration_minutes?: number;
    calories_burned?: number;
    notes?: string | null;
  };
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState<WorkoutFormState, FormData>(action, { error: null });

  return (
    <form action={formAction} className="glass-card-solid space-y-4 p-5">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-black/60 dark:text-white/60">Workout type</label>
        <select
          name="workout_type"
          defaultValue={defaults?.workout_type ?? "walking"}
          required
          className="h-12 w-full rounded-xl border border-black/[0.08] bg-white/70 px-4 text-sm outline-none focus:border-emerald-500 dark:border-white/[0.08] dark:bg-white/[0.04]"
        >
          {WORKOUT_TYPES.map((type) => (
            <option key={type} value={type}>
              {WORKOUT_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-black/60 dark:text-white/60">Date</label>
          <Input name="date" type="date" required defaultValue={defaults?.date} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-black/60 dark:text-white/60">Start time</label>
          <Input name="start_time" type="time" required defaultValue={defaults?.start_time ?? "07:00"} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-black/60 dark:text-white/60">Duration (min)</label>
          <Input
            name="duration_minutes"
            type="number"
            inputMode="numeric"
            min={0}
            required
            defaultValue={defaults?.duration_minutes}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-black/60 dark:text-white/60">Calories burned</label>
          <Input
            name="calories_burned"
            type="number"
            inputMode="numeric"
            min={0}
            required
            defaultValue={defaults?.calories_burned}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-black/60 dark:text-white/60">Notes (optional)</label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={defaults?.notes ?? ""}
          className="w-full resize-none rounded-xl border border-black/[0.08] bg-white/70 p-3 text-sm outline-none focus:border-emerald-500 dark:border-white/[0.08] dark:bg-white/[0.04]"
        />
      </div>

      {state.error && <p className="text-sm text-red-500">{state.error}</p>}

      <SubmitButton label={submitLabel} />
    </form>
  );
}
