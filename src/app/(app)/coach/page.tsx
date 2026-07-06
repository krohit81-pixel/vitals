import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ProfileMenuButton } from "@/components/navigation/profile-menu-button";

export default function CoachPage() {
  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-cream-100">AI Coach</h1>
        <ProfileMenuButton />
      </div>
      <EmptyState
        icon={Sparkles}
        title="Your coach is warming up"
        description="Once a few days of meals are logged, your AI Coach will review intake patterns and share supportive, evidence-based guidance here."
      />
    </div>
  );
}
