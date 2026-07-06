import { randomBytes, createHash } from "crypto";

/** A fresh, random personal sync token — shown to the user exactly once. */
export function generateSyncToken(): string {
  return randomBytes(24).toString("base64url");
}

/** We only ever store this hash, never the raw token — same principle as a password. */
export function hashSyncToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Best-effort mapping from whatever string a Health/Shortcuts export uses to our enum. */
export function normalizeWorkoutType(raw: string): string {
  const s = raw.toLowerCase();
  if (s.includes("run")) return "running";
  if (s.includes("walk")) return "walking";
  if (s.includes("elliptical")) return "elliptical";
  if (s.includes("cycl") || s.includes("bik")) return "cycling";
  if (s.includes("swim")) return "swimming";
  if (s.includes("strength") || s.includes("weight") || s.includes("functional")) return "strength_training";
  if (s.includes("hiit") || s.includes("interval") || s.includes("high intensity")) return "hiit";
  if (s.includes("yoga") || s.includes("mind")) return "yoga";
  if (s.includes("row")) return "rowing";
  if (s.includes("hik")) return "hiking";
  if (s.includes("soccer") || s.includes("basketball") || s.includes("tennis") || s.includes("sport")) return "sports";
  return "other";
}
