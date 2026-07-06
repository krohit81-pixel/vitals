import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * NEVER import this into anything a browser could trigger — it bypasses Row
 * Level Security entirely. Only used by /api/health/sync, which authenticates
 * requests with its own bearer-token mechanism instead of a Supabase user
 * session, so it has no auth.uid() for RLS to check against in the first place.
 */
export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
