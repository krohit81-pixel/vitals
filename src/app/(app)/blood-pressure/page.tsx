import Link from "next/link";
import { ArrowLeft, Stethoscope } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shared/empty-state";
import { BloodPressureForm } from "./bp-form";
import { BloodPressureList } from "./bp-list";

export default async function BloodPressurePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: logs } = await supabase
    .from("blood_pressure_logs")
    .select("id, systolic, diastolic, measured_at, notes")
    .eq("user_id", user!.id)
    .order("measured_at", { ascending: false });

  const entries = logs ?? [];

  return (
    <div className="animate-fade-up space-y-5 pb-8">
      <div className="flex items-center gap-3 print:hidden">
        <Link href="/profile" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-display text-xl font-semibold text-ink dark:text-cream-100">Blood Pressure</h1>
      </div>

      <BloodPressureForm />

      {entries.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No readings logged yet"
          description="Add your first reading above — date, time, systolic, diastolic, and an optional note."
        />
      ) : (
        <BloodPressureList entries={entries} />
      )}
    </div>
  );
}
