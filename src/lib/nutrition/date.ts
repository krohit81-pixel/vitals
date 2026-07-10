/**
 * Central date utilities. Everything here works with plain "YYYY-MM-DD"
 * strings (matching the `date` column type in Postgres) rather than Date
 * objects with time components, to avoid timezone drift when the same string
 * crosses the client/server boundary.
 *
 * Anything that needs "today" must be called from a Client Component — see
 * LocalTime / GreetingText for why: Postgres/Vercel servers run in UTC, so
 * "today" server-side is not the same as the viewer's actual today.
 */

export type ViewMode = "day" | "week" | "month";

export type RangeOption = "7d" | "30d" | "90d" | "1y";

export function rangeToDays(range: RangeOption): number {
  return { "7d": 7, "30d": 30, "90d": 90, "1y": 365 }[range];
}

export const RANGE_LABELS: Record<RangeOption, string> = {
  "7d": "7 Days",
  "30d": "30 Days",
  "90d": "90 Days",
  "1y": "1 Year",
};

export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateString(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

/** "Today" in the caller's local timezone — only meaningful when called client-side. */
export function localTodayString(): string {
  return toDateString(new Date());
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDateString(dateStr);
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

export function addMonths(dateStr: string, months: number): string {
  const d = parseDateString(dateStr);
  d.setMonth(d.getMonth() + months);
  return toDateString(d);
}

/** Monday-based start of the week containing dateStr. */
export function startOfWeek(dateStr: string): string {
  const d = parseDateString(dateStr);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toDateString(d);
}

export function endOfWeek(dateStr: string): string {
  return addDays(startOfWeek(dateStr), 6);
}

export function startOfMonth(dateStr: string): string {
  const d = parseDateString(dateStr);
  return toDateString(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function endOfMonth(dateStr: string): string {
  const d = parseDateString(dateStr);
  return toDateString(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

/** Every date string from start to end, inclusive. */
export function datesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  let current = start;
  while (current <= end) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

/** Returns the [start, end] bounds for a given view anchored on a date. */
export function periodBounds(view: ViewMode, anchor: string): [string, string] {
  if (view === "week") return [startOfWeek(anchor), endOfWeek(anchor)];
  if (view === "month") return [startOfMonth(anchor), endOfMonth(anchor)];
  return [anchor, anchor];
}

/** Steps the anchor date forward/back by one unit of the given view. */
export function stepAnchor(view: ViewMode, anchor: string, direction: 1 | -1): string {
  if (view === "week") return addDays(anchor, 7 * direction);
  if (view === "month") return addMonths(anchor, direction);
  return addDays(anchor, direction);
}

export function formatFriendlyDate(date: Date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** Human label for the current view/anchor, e.g. "Monday, July 6" / "Jun 30 – Jul 6" / "July 2026". */
export function formatPeriodLabel(view: ViewMode, anchor: string): string {
  if (view === "day") return formatFriendlyDate(parseDateString(anchor));

  if (view === "month") {
    return parseDateString(anchor).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }

  const [start, end] = periodBounds(view, anchor);
  const startLabel = parseDateString(start).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endLabel = parseDateString(end).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${startLabel} – ${endLabel}`;
}
