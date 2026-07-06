"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateGoalsAction, type GoalsFormState } from "./actions";

const initialState: GoalsFormState = { error: null };

const FIELDS: Array<{ name: string; label: string; unit: string }> = [
  { name: "calorie_target", label: "Calories", unit: "kcal" },
  { name: "protein_target_g", label: "Protein", unit: "g" },
  { name: "carb_target_g", label: "Carbs", unit: "g" },
  { name: "fat_target_g", label: "Fat", unit: "g" },
  { name: "fibre_target_g", label: "Fibre", unit: "g" },
  { name: "water_target_ml", label: "Water", unit: "ml" },
];

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Saving…" : "Save goals"}
    </Button>
  );
}

export function GoalsForm({
  defaults,
}: {
  defaults: Record<string, number>;
}) {
  const [state, formAction] = useActionState(updateGoalsAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {FIELDS.map((field) => (
        <div key={field.name} className="space-y-1.5">
          <label className="text-xs font-medium text-black/60 dark:text-white/60">
            {field.label} <span className="text-black/35 dark:text-white/35">({field.unit})</span>
          </label>
          <Input
            name={field.name}
            type="number"
            inputMode="numeric"
            min={0}
            defaultValue={defaults[field.name]}
            required
          />
        </div>
      ))}

      {state.error && <p className="text-sm text-red-500">{state.error}</p>}

      <p className="text-xs text-black/40 dark:text-white/40">
        Auto-calculating targets from a goal weight is planned for later — for now, set them directly.
      </p>

      <SaveButton />
    </form>
  );
}
