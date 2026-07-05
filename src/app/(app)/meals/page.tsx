import { UtensilsCrossed } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export default function MealsPage() {
  return (
    <div className="animate-fade-up space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink dark:text-cream-100">Meals</h1>
      <EmptyState
        icon={UtensilsCrossed}
        title="No meals logged yet"
        description="Photo, voice, and manual logging arrive in Milestone 2 — tap the + button to see the capture flow."
      />
    </div>
  );
}
