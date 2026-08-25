"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updatePersonalDetailsAction, type PersonalDetailsFormState } from "./actions";

const initialState: PersonalDetailsFormState = { error: null };

export interface PersonalDetailsDefaults {
  full_name: string;
  age: number | "";
  gender: string;
  height_cm: number | "";
  weight_kg: number | "";
  goal_weight_kg: number | "";
  activity_level: string;
  diet_type: string;
  units: string;
  allergies: string;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Saving…" : "Save details"}
    </Button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-black/60 dark:text-white/60">{label}</label>
      {children}
    </div>
  );
}

function Select({
  name,
  defaultValue,
  options,
}: {
  name: string;
  defaultValue: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="h-12 w-full rounded-xl border border-black/[0.08] bg-white/70 px-3 text-sm outline-none transition-colors focus:border-emerald-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-cream-100"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function PersonalDetailsForm({ defaults }: { defaults: PersonalDetailsDefaults }) {
  const [state, formAction] = useActionState(updatePersonalDetailsAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Full name">
        <Input name="full_name" type="text" defaultValue={defaults.full_name} placeholder="Your name" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Age">
          <Input name="age" type="number" inputMode="numeric" min={0} defaultValue={defaults.age} />
        </Field>
        <Field label="Gender">
          <Select
            name="gender"
            defaultValue={defaults.gender}
            options={[
              { value: "prefer_not_to_say", label: "Prefer not to say" },
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
              { value: "other", label: "Other" },
            ]}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Height (cm)">
          <Input name="height_cm" type="number" inputMode="decimal" min={0} defaultValue={defaults.height_cm} />
        </Field>
        <Field label="Weight (kg)">
          <Input name="weight_kg" type="number" inputMode="decimal" min={0} defaultValue={defaults.weight_kg} />
        </Field>
      </div>

      <Field label="Goal weight (kg)">
        <Input
          name="goal_weight_kg"
          type="number"
          inputMode="decimal"
          min={0}
          defaultValue={defaults.goal_weight_kg}
          placeholder="Optional — where you're aiming for"
        />
      </Field>

      <Field label="Activity level">
        <Select
          name="activity_level"
          defaultValue={defaults.activity_level}
          options={[
            { value: "sedentary", label: "Sedentary — little to no exercise" },
            { value: "light", label: "Light — 1-3 days/week" },
            { value: "moderate", label: "Moderate — 3-5 days/week" },
            { value: "active", label: "Active — 6-7 days/week" },
            { value: "very_active", label: "Very active — physical job or 2x/day training" },
          ]}
        />
      </Field>

      <Field label="Diet type">
        <Select
          name="diet_type"
          defaultValue={defaults.diet_type}
          options={[
            { value: "non_vegetarian", label: "Non-vegetarian" },
            { value: "vegetarian", label: "Vegetarian" },
            { value: "vegan", label: "Vegan" },
          ]}
        />
      </Field>

      <Field label="Allergies / foods to avoid (comma-separated)">
        <Input name="allergies" type="text" defaultValue={defaults.allergies} placeholder="e.g. peanuts, shellfish" />
      </Field>

      <Field label="Preferred units">
        <Select
          name="units"
          defaultValue={defaults.units}
          options={[
            { value: "metric", label: "Metric (kg)" },
            { value: "imperial", label: "Imperial (lb)" },
          ]}
        />
      </Field>

      {state.error && <p className="text-sm text-red-500">{state.error}</p>}

      <p className="text-xs text-black/40 dark:text-white/40">
        Used by AI Coach to tailor feedback and insights to you — e.g. protein needs relative to
        body weight, activity level, and dietary restrictions. Height/weight here are your baseline
        profile, separate from your logged weight history on the Progress tab. Goal weight shows up
        there too — as a dashed line on the Weight chart and a % there in the Weight card.
      </p>

      <SaveButton />
    </form>
  );
}
