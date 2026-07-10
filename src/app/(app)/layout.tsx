import { NavShell } from "@/components/navigation/nav-shell";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: latestWeight }, { data: profile }] = await Promise.all([
    supabase
      .from("weight_logs")
      .select("weight, unit")
      .eq("user_id", user!.id)
      .order("measured_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("users").select("units").eq("id", user!.id).single(),
  ]);

  const defaultUnit: "kg" | "lb" = latestWeight?.unit ?? (profile?.units === "imperial" ? "lb" : "kg");

  return (
    <NavShell previousWeight={latestWeight?.weight ?? null} weightUnit={defaultUnit}>
      {children}
    </NavShell>
  );
}
