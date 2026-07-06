# Changes — v0.3

Everything below is in `vitals-0.3.zip`, paths mirror your repo — unzip over `src/` and
copy `BACKLOG.md` to your repo root.

**Files to add (new):**
- `BACKLOG.md` (updated — replace if you already have it)
- `src/components/shared/local-time.tsx`
- `src/components/meals/water-summary-card.tsx`
- `src/app/(app)/meals/[id]/page.tsx`
- `src/app/(app)/meals/[id]/actions.ts`
- `src/app/(app)/meals/[id]/delete-meal-button.tsx`

**Files to replace (existing):**
- `src/lib/nutrition/water-actions.ts`
- `src/components/navigation/capture-sheet.tsx`
- `src/components/shared/meal-card.tsx`
- `src/app/(app)/dashboard/page.tsx`
- `src/app/(app)/meals/page.tsx`

No SQL changes this round.

---

## 1. Meal detail page (backlog item)

New route: `/meals/[id]`. Shows the photo (fetched via a signed URL — the storage bucket
is private), every detected item, the full nutrient breakdown (calories, protein, carbs,
fat, fibre, sugar, sodium), the AI's confidence and explanation, what you originally typed
(for manual/voice entries), and a delete option (with confirm) that also correctly
recomputes that day's totals afterward.

## 2. Dashboard/Meals → tap a meal → detail page (backlog item)

`MealCard` now accepts an `href` — both the Dashboard's "Today's Meals" and the Meals
tab's cards link straight to `/meals/[id]`.

## 3. Timezone bug — meal times showing wrong

**Root cause:** meal lists are Server Components. `toLocaleTimeString()` running there
uses the *server's* timezone (Vercel functions run in UTC), not yours — so every time was
off by however many hours you are from UTC.

**Fix:** new `<LocalTime iso={...} />` component, marked `"use client"`, so the actual
formatting happens in your browser instead of the server. It renders blank for an instant
on load, then fills in — that's intentional (avoids a React hydration warning), not a bug.

**One related thing I did *not* fix, flagged in BACKLOG.md:** "today" itself (which meals
count as today's) is still computed using the server's UTC clock, not yours. In practice
this only matters if you log a meal between midnight and ~5:30am your time — edge case,
but noting it so it's not a surprise later. Real fix needs your timezone stored
server-side (e.g. captured at signup), which felt like its own small piece of work rather
than something to fold in silently here.

## 4. Water section on the Meals tab

Meals tab now groups entries into Breakfast / Lunch / Dinner / Snack sections (only
shows sections that have something logged), plus a **Water** card above them — separate
from the meal groups, always visible, showing today's total against your target with a
quick "+250ml" button right there (no need to open the `+` sheet for a fast top-up).

---

## Verified

`npx tsc --noEmit` and `npx eslint src` both clean.
