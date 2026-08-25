import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { PersonalDetailsForm } from "./personal-details-form";

export default async function PersonalDetailsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: goals }] = await Promise.all([
    supabase.from("users").select("*").eq("id", user!.id).single(),
    // goal_weight_kg lives on `goals` (it's also what Progress's Weight card/
    // chart and the achievements calc already read) — Personal Details is
    // just where it's edited, not a second, separate value.
    supabase.from("goals").select("goal_weight_kg").eq("user_id", user!.id).single(),
  ]);

  const defaults = {
    full_name: profile?.full_name ?? "",
    age: profile?.age ?? ("" as number | ""),
    gender: profile?.gender ?? "prefer_not_to_say",
    height_cm: profile?.height_cm ?? ("" as number | ""),
    weight_kg: profile?.weight_kg ?? ("" as number | ""),
    goal_weight_kg: goals?.goal_weight_kg ?? ("" as number | ""),
    activity_level: profile?.activity_level ?? "moderate",
    diet_type: profile?.diet_type ?? "non_vegetarian",
    units: profile?.units ?? "metric",
    allergies: (profile?.allergies ?? []).join(", "),
  };

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-display text-xl font-semibold text-ink dark:text-cream-100">Personal details</h1>
      </div>

      <Card>
        <PersonalDetailsForm defaults={defaults} />
      </Card>
    </div>
  );
}
