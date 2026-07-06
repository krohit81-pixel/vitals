import { TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ProfileMenuButton } from "@/components/navigation/profile-menu-button";

export default function ProgressPage() {
  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-cream-100">Progress</h1>
        <ProfileMenuButton />
      </div>
      <EmptyState
        icon={TrendingUp}
        title="Your trends will show up here"
        description="Weight tracking, body measurements, and animated weekly charts land in Milestone 3."
      />
    </div>
  );
}
