"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateSyncToken, hashSyncToken } from "@/lib/nutrition/health-sync";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

/** Generates a fresh token, stores only its hash, and returns the raw token — shown once. */
export async function connectHealthAction(): Promise<{ token: string } | { error: string }> {
  try {
    const { supabase, userId } = await requireUser();
    const token = generateSyncToken();

    const { error } = await supabase
      .from("settings")
      .upsert(
        { user_id: userId, health_connected: true, health_sync_token_hash: hashSyncToken(token) },
        { onConflict: "user_id" }
      );

    if (error) return { error: error.message };

    revalidatePath("/profile/health");
    return { token };
  } catch {
    return { error: "Couldn't connect Apple Health. Try again." };
  }
}

export async function disconnectHealthAction() {
  const { supabase, userId } = await requireUser();

  await supabase
    .from("settings")
    .update({ health_connected: false, health_sync_token_hash: null })
    .eq("user_id", userId);

  revalidatePath("/profile/health");
}
