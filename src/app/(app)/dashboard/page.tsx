import { Droplet, Beef, Wheat, Droplets, Leaf } from "lucide-react";
import { CalorieRing } from "@/components/dashboard/calorie-ring";
import { MacroCard } from "@/components/dashboard/macro-card";
import { MealCard, type MealCardData } from "@/components/shared/meal-card";

// TODO(Milestone 2): replace with a Server Component query against
// daily_totals + meal_logs, scoped to auth.uid() via RLS.
const MOCK_TODAY = {
  greetingName: "Rohit",
  calories: { consumed: 1420, target: 2100 },
  macros: {
    protein: { current: 82, target: 130, icon: Beef },
    carbs: { current: 140, target: 220, icon: Wheat },
    fat: { current: 45, target: 70, icon: Droplet },
    fibre: { current: 14, target: 30, icon: Leaf },
    water: { current: 1200, target: 2500, icon: Droplets },
  },
  meals: [
    { id: "1", type: "Breakfast", name: "2 eggs, toast & coffee", time: "8:10 AM", calories: 420, proteinG: 22, carbsG: 38, fatG: 18 },
    { id: "2", type: "Lunch", name: "Dal, rice & sabzi", time: "1:30 PM", calories: 610, proteinG: 24, carbsG: 88, fatG: 14 },
    { id: "3", type: "Snack", name: "Protein shake", time: "4:45 PM", calories: 190, proteinG: 25, carbsG: 8, fatG: 3 },
  ] as MealCardData[],
};

export default function DashboardPage() {
  const { greetingName, calories, macros, meals } = MOCK_TODAY;

  return (
    <div className="animate-fade-up space-y-6">
      <header>
        <p className="text-sm text-black/50 dark:text-white/50">Good morning,</p>
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-cream-100">
          {greetingName}
        </h1>
      </header>

      <section className="glass-card flex flex-col items-center">
        <span className="mb-1 text-sm font-medium text-black/60 dark:text-white/60">
          Today&apos;s Summary
        </span>
        <CalorieRing consumed={calories.consumed} target={calories.target} />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <MacroCard icon={macros.protein.icon} label="Protein" current={macros.protein.current} target={macros.protein.target} unit="g" />
        <MacroCard icon={macros.carbs.icon} label="Carbs" current={macros.carbs.current} target={macros.carbs.target} unit="g" colorClass="bg-sky-500" />
        <MacroCard icon={macros.fat.icon} label="Fat" current={macros.fat.current} target={macros.fat.target} unit="g" colorClass="bg-amber-500" />
        <MacroCard icon={macros.fibre.icon} label="Fibre" current={macros.fibre.current} target={macros.fibre.target} unit="g" />
        <MacroCard icon={macros.water.icon} label="Water" current={macros.water.current} target={macros.water.target} unit="ml" colorClass="bg-sky-500" />
      </section>

      <section>
        <h2 className="mb-3 font-display text-base font-medium text-ink dark:text-cream-100">
          Today&apos;s Meals
        </h2>
        <div className="space-y-2.5">
          {meals.map((meal) => (
            <MealCard key={meal.id} meal={meal} />
          ))}
        </div>
      </section>
    </div>
  );
}
