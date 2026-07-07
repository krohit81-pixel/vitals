# Changes — v0.4: dashboard/analytics redesign

**Files to add (new):**
- `src/lib/nutrition/streak.ts`
- `src/components/dashboard/streak-card.tsx`
- `src/components/analytics/macro-split-card.tsx`

**Files to replace (existing):**
- `BACKLOG.md`
- `src/components/analytics/metric-trend-card.tsx`
- `src/components/analytics/comparison-trend-card.tsx`
- `src/app/(app)/dashboard/page.tsx`

All in `vitals-v0.4.zip`, paths mirror the repo. No SQL changes, no new dependencies
(still just `recharts`, already installed).

---

## What changed, against your reference screenshot

**1. Bar charts, not area charts.** Every trend card (Calories, Protein, Carbs, Fat,
Fibre, Water, Workout Duration, Workout Frequency) now renders as a bar chart. Bars are
shaded solid when that day crossed target, softer when under — a lighter-weight version
of your reference's checkmark/red-line treatment, done through color rather than icons
overlaid on each bar (kept the chart component generic rather than hardcoding icon
placement logic into it).

**2. Under/Over headline framing.** Replaced the plain "average/day" number with your
screenshot's gauge-card language: a big colored number ("118" / "6"), labeled "under" or
"over," in that metric's own color — same as your reference showing calories in green,
protein in purple. Kept the existing consistency-% badge alongside it rather than
replacing it, since that was useful information the reference screenshot doesn't
otherwise surface.

**3. Consumed vs Burned → grouped bars + a Net line.** This is the "breakdown of
consumed, burned, and total for each day" ask specifically: two bars per day (Consumed,
Burned) with a dark line tracing Net (their difference) across the top — all three
numbers visible in one chart instead of needing to infer the total.

**4. Streak — built as a real mechanic, not a static row of dots.** A day counts as a
"hit" only if something was actually logged (an empty day can't accidentally count) and
net calories landed within 5% of target. Shows your current streak length plus the last
7 days as filled/empty circles. Lives right under the calorie ring on the Dashboard's
Day view, and always reflects the 7 days ending on whatever date `DateNavigator` has you
looking at — so it stays meaningful if you're reviewing a past day, not just "today."

**5. Macro Split card** — pie chart (average Fat/Carbs/Protein proportion, gram-based
like your reference, not calorie-weighted) plus a stacked daily bar and inline
percentages. Added to the Week/Month Nutrition section, right above the individual
Protein/Carbs/Fat cards. No new query needed — reuses the same range data those cards
already fetch.

## What I deliberately didn't copy

The reference screenshot's orange gradient header, calendar pill, and bottom nav icon
style are a different app's visual identity — Vitals already has its own (emerald/cream,
established since Milestone 1), so I took the *mechanics* (bar charts, under/over
framing, streak, macro pie+stack) without importing another app's branding on top of
yours.

---

## Verified

`npx tsc --noEmit` and `npx eslint src` both clean.
