# Changes — Milestone 3: historical navigation + trends

**Files to add (new):**
- `src/lib/nutrition/get-range-totals.ts`
- `src/lib/nutrition/consistency.ts`
- `src/components/shared/date-navigator.tsx`
- `src/components/dashboard/period-selector.tsx`
- `src/components/analytics/metric-trend-card.tsx`

**Files to replace (existing):**
- `package.json` (added `recharts`)
- `BACKLOG.md`
- `src/lib/nutrition/date.ts` (rewritten — much more in it now)
- `src/lib/nutrition/save-meal.ts` (consolidated date helper only)
- `src/lib/nutrition/water-actions.ts` (also fixes a timezone bug, see below)
- `src/components/navigation/capture-sheet.tsx`
- `src/components/meals/water-summary-card.tsx`
- `src/app/(app)/dashboard/page.tsx` (full rewrite)
- `src/app/(app)/meals/page.tsx` (full rewrite)
- `src/app/(app)/meals/[id]/actions.ts` (consolidated date helper only)

All in `vitals-milestone3.zip`. Run `npm install` after replacing `package.json` — new
dependency (`recharts`). No SQL changes.

---

## What's new

**Date navigation** — `DateNavigator`: prev/next arrows plus a tap-anywhere-on-the-label
calendar picker (native date input, invisible, overlaid — opens your OS's actual date
picker). Drives a `?date=YYYY-MM-DD` URL param, so it's a real page (bookmarkable,
back-button works) rather than client-only state. Used on both Dashboard and Meals.

**Day/Week/Month** — `PeriodSelector` drives `?view=day|week|month`. Day view is the
existing single-day dashboard (ring, macros, meals), just now driven by whatever date is
selected instead of always "today". Week/Month swap in `TrendsView` instead — six
`MetricTrendCard`s (calories, protein, carbs, fat, fibre, water), no ring.

**Trend charts** — `MetricTrendCard` takes only generic props (`label`, `unit`, `color`,
`data`, `target`) — nothing nutrition-specific baked in. Minimal area chart (recharts),
dashed target line, tiny date-axis, a KPI header (avg/day) instead of a paragraph, and a
consistency badge (green ≥70%, amber below) instead of an AI-written summary — per your
"charts over text" direction. **This is the piece meant to carry over to weight tracking
later with zero changes** — just pass it a `{date, value}[]` series for weight instead of
a macro.

**Consistency scoring** — `calcConsistency()`: % of days that hit ≥80% of target (not a
strict ≥100% check — one slightly-under day shouldn't tank the score for otherwise-solid
weeks). Reused identically across all six metrics.

**Gap-filling** — `getDailyTotalsRange()` always returns one row per date in the range,
zero-filled for days with nothing logged, so a week with 2 quiet days doesn't produce a
broken or misleading chart.

## Also fixed while in there

**`logWaterAction` had the same timezone bug as the meal-timestamp/greeting issues** —
it computed "today" server-side (UTC), rather than using the caller's actual local day.
Now takes the date as a parameter, computed client-side (`localTodayString()`) by both
call sites (the `+` sheet and the Meals-tab water card) before calling it. Same root
cause, same fix pattern as before — worth doing now since I was already touching this file
to consolidate the date helpers.

## Known limitation, not fixed this round (flagged in BACKLOG.md)

Week/Month boundaries (`startOfWeek`, `startOfMonth`) are computed from whatever anchor
date they're given — so they inherit the same day-boundary edge case already noted for
meal logging (server's UTC clock vs. your local midnight, only matters for very-late-night
usage). Proper fix is still "store the user's IANA timezone," same as noted before —
didn't want to scope-creep that into this round given you were explicit about historical
navigation and trends being the focus here, not new data capture.

---

## Verified

`npx tsc --noEmit` and `npx eslint src` both clean.
