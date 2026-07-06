"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * `dateStr` must be computed client-side (see `localTodayString()` in
 * lib/nutrition/date.ts) and passed in — computing "today" here, server-side,
 * would use the server's UTC clock rather than the caller's actual local day,
 * the same bug class fixed for meal timestamps and the dashboard greeting.
 */
export async function logWaterAction(amountMl: number, dateStr: string) {
  if (!Number.isFinite(amountMl) || amountMl <= 0) {
    throw new Error("Enter a positive amount of water in ml.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const date = dateStr;

  const { data: existing } = await supabase
    .from("daily_totals")
    .select("water_ml")
    .eq("user_id", user.id)
    .eq("date", date)
    .single();

  const newWaterMl = Number(existing?.water_ml ?? 0) + amountMl;

  const { error } = await supabase
    .from("daily_totals")
    .upsert(
      { user_id: user.id, date, water_ml: newWaterMl },
      { onConflict: "user_id,date" }
    );

  if (error) throw error;

  revalidatePath("/dashboard");
  return newWaterMl;
}
