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

export interface ExtractedWorkout {
  workoutType: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  durationMinutes: number;
  caloriesBurned: number;
  healthWorkoutId: string;
}

/** First value found across several possible key spellings — Shortcuts' exact
 * field naming for a Health sample dictionary isn't something that can be
 * verified without a real device, so this checks the most likely variants
 * rather than assuming one exact shape. */
function pick(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") return obj[key];
  }
  return undefined;
}

/** Pulls a number out of a value that might be a number, or a string like "450 kcal" / "32 min". */
function parseNumeric(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
    if (match) return parseFloat(match[0]);
  }
  return null;
}

/** Extracts literal wall-clock date/time from an ISO-ish string, ignoring any
 * timezone offset in it — we want "what the clock said" where the workout
 * happened, not a server-timezone reinterpretation of the same instant. */
function parseWallClock(value: unknown): { date: string; time: string } | null {
  if (typeof value !== "string") return null;

  const isoMatch = value.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  if (isoMatch) return { date: isoMatch[1]!, time: isoMatch[2]! };

  // Fallback for less-structured date strings — best-effort only. Note this
  // path uses the JS Date object, which *can* shift by timezone if the string
  // has an offset; the ISO-prefix match above is the reliable path and should
  // cover most real output, but this exists so a workout isn't silently
  // dropped just because the format is slightly different than expected.
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return null;
  const date = parsed.toISOString().slice(0, 10);
  const time = parsed.toISOString().slice(11, 16);
  return { date, time };
}

/**
 * Tolerantly extracts what we need from one raw workout dictionary, however
 * Shortcuts happened to key it. Returns null (rather than throwing) for
 * anything unrecognizable, so one malformed entry doesn't fail the whole
 * sync — the API route counts it as "skipped" instead.
 */
export function extractWorkoutFields(raw: Record<string, unknown>): ExtractedWorkout | null {
  const typeRaw = pick(raw, ["Workout Type", "Activity Type", "Type", "workoutType", "Health Sample Type"]);
  const idRaw = pick(raw, ["UUID", "Identifier", "healthWorkoutId", "ID"]);
  const startRaw = pick(raw, ["Start Date", "startDate", "Date", "startTime"]);
  const durationRaw = pick(raw, ["Duration", "durationMinutes", "duration"]);
  const caloriesRaw = pick(raw, ["Total Energy Burned", "Active Energy", "Energy Burned", "Calories", "caloriesBurned"]);

  if (typeof typeRaw !== "string" || typeof idRaw !== "string") return null;

  const wallClock = parseWallClock(startRaw);
  if (!wallClock) return null;

  const durationValue = parseNumeric(durationRaw);
  const caloriesValue = parseNumeric(caloriesRaw);
  if (durationValue === null || caloriesValue === null) return null;

  // HKWorkout.duration is in seconds; Shortcuts' raw "Duration" is typically
  // that same seconds value. Values under ~20 are almost certainly already
  // minutes (no one's workout is under 20 seconds), so only convert down from
  // seconds when the number looks large enough to actually be seconds.
  const durationMinutes = durationValue > 20 ? durationValue / 60 : durationValue;

  return {
    workoutType: normalizeWorkoutType(typeRaw),
    date: wallClock.date,
    startTime: wallClock.time,
    durationMinutes: Math.round(durationMinutes),
    caloriesBurned: Math.round(caloriesValue),
    healthWorkoutId: idRaw,
  };
}
