import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { GoalsForm } from "./goals-form";

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user!.id)
    .single();

  const defaults = {
    calorie_target: goals?.calorie_target ?? 2000,
    protein_target_g: goals?.protein_target_g ?? 120,
    carb_target_g: goals?.carb_target_g ?? 220,
    fat_target_g: goals?.fat_target_g ?? 65,
    fibre_target_g: goals?.fibre_target_g ?? 30,
    water_target_ml: goals?.water_target_ml ?? 2500,
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
        <h1 className="font-display text-xl font-semibold text-ink dark:text-cream-100">
          Daily goals
        </h1>
      </div>

      <Card>
        <GoalsForm defaults={defaults} />
      </Card>
    </div>
  );
}
