"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingRing } from "@/components/shared/loading-ring";
import { MEAL_TYPE_LABELS, type MealType } from "@/lib/nutrition/meal-type";
import { cn } from "@/lib/utils";
import { updateMealAction } from "./actions";

export interface EditableMeal {
  id: string;
  mealType: MealType;
  loggedAtIso: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fibreG: number;
  sugarG: number;
  sodiumMg: number;
}

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditMealForm({ meal }: { meal: EditableMeal }) {
  const router = useRouter();
  const [mealType, setMealType] = useState<MealType>(meal.mealType);
  // Computed client-side only (in an effect, not directly in render) — the
  // server doesn't know the viewer's timezone, so a server-computed value
  // here would repeat the exact "shows server time" bug this app has already
  // been bitten by twice (see docs/ARCHITECTURE.md).
  const [loggedAt, setLoggedAt] = useState("");
  useEffect(() => setLoggedAt(toDatetimeLocal(meal.loggedAtIso)), [meal.loggedAtIso]);

  const [calories, setCalories] = useState(meal.calories);
  const [proteinG, setProteinG] = useState(meal.proteinG);
  const [carbsG, setCarbsG] = useState(meal.carbsG);
  const [fatG, setFatG] = useState(meal.fatG);
  const [fibreG, setFibreG] = useState(meal.fibreG);
  const [sugarG, setSugarG] = useState(meal.sugarG);
  const [sodiumMg, setSodiumMg] = useState(meal.sodiumMg);

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      try {
        await updateMealAction(meal.id, {
          mealType,
          loggedAt: new Date(loggedAt).toISOString(),
          calories,
          proteinG,
          carbsG,
          fatG,
          fibreG,
          sugarG,
          sodiumMg,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't save changes.");
      }
    });
  };

  return (
    <div className="animate-fade-up space-y-5 py-2">
      <div className="flex gap-2">
        {(Object.keys(MEAL_TYPE_LABELS) as MealType[]).map((type) => (
          <button
            key={type}
            onClick={() => setMealType(type)}
            className={cn(
              "flex-1 rounded-xl py-2 text-xs font-medium transition-colors",
              mealType === type
                ? "bg-emerald-500 text-white"
                : "bg-black/[0.04] text-black/60 dark:bg-white/[0.06] dark:text-white/60"
            )}
          >
            {MEAL_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-black/50 dark:text-white/50">Logged at</label>
        <Input
          type="datetime-local"
          value={loggedAt}
          onChange={(e) => setLoggedAt(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Calories" value={calories} onChange={setCalories} />
        <Field label="Protein (g)" value={proteinG} onChange={setProteinG} />
        <Field label="Carbs (g)" value={carbsG} onChange={setCarbsG} />
        <Field label="Fat (g)" value={fatG} onChange={setFatG} />
        <Field label="Fibre (g)" value={fibreG} onChange={setFibreG} />
        <Field label="Sugar (g)" value={sugarG} onChange={setSugarG} />
      </div>
      <Field label="Sodium (mg)" value={sodiumMg} onChange={setSodiumMg} />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={() => router.back()} disabled={pending}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={handleSave} disabled={pending}>
          {pending && <LoadingRing size={14} className="text-white" />}
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-black/50 dark:text-white/50">{label}</label>
      <Input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  );
}
