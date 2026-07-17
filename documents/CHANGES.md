# Changes — v0.6.4

**8 files** in `vitals-v0.6.4.zip`, paths mirror the repo.

## Required manual step

**Re-run `supabase/schema.sql`** — fixes the ordering bug from last round
(`meal_shortcuts` was created after RLS already tried to touch it). If you never
managed to get the previous version to run due to that error, this replaces it
entirely; if you'd already worked around it manually, re-running this version is still
safe (idempotent as always).

---

## Bugs fixed

**1. schema.sql "relation does not exist"** — root cause: I'd inserted the
`meal_shortcuts` table definition physically *after* the RLS section that enables row
level security and creates policies on it. Postgres executes top to bottom, so it hit
`alter table public.meal_shortcuts enable row level security` before the table existed
yet. Moved the `CREATE TABLE` to sit with the other table definitions, before RLS runs.

**2. Manual Entry shortcuts replaced text instead of appending.** Now shortcuts are
individual per-user items (protein source, a side, etc.) rather than the old hardcoded
whole-meal phrases, so tapping a second one should add to what you're building, not
erase it. Fixed: `setText(prev => prev ? prev + ", " + label : label)`.

**3. "1 day streak" text didn't match the visible dots.** Not actually a bug in the
math — `currentStreakLength` correctly counts *consecutive* hits ending on the most
recent finished day, and a miss on Wednesday breaking up two checkmarks legitimately
means "streak: 1." But that's a confusing thing to explain in a small UI label, so per
your call, removed the text entirely. The day-dots row (checkmark/cross per day) already
shows the real pattern without needing a single number to summarize it.

## Redesign — scoped to the two hero rings + macro cards this round

Took the *energy* from your reference screenshots — vivid multi-hue gradients, bold
glow, big confident numbers, a slider-thumb marker showing exactly where the current
value sits — without cloning their specific purple/red palette. Vitals has had its own
emerald/blue identity since Milestone 1; this pushes that palette more vivid rather than
replacing it with someone else's brand colors.

- **`CalorieRing`** — richer gradient (green to emerald to sky blue), stronger glow,
  bigger number, and a new slider-thumb dot that tracks along the arc to mark the exact
  current position (computed via the same raw pre-rotation coordinate space the
  stroke-dasharray arc uses, so it lands exactly on the visible arc's end).
- **`HealthScoreRing`** (Progress tab) — same treatment, tuned per score tier.
- **`MacroCard`** — redesigned as a slider (track + fill + thumb) instead of a plain
  static bar, bigger bold values, and diversified per-metric colors (protein is now
  violet, water is now cyan, instead of both borrowing blue). Also fixed a real
  pre-existing bug while in there: the card's icon color was hardcoded to emerald
  regardless of which metric's color was passed in — every macro's icon looked the same
  color even though the bar beneath it didn't.

**Not touched yet, flagged in `BACKLOG.md` rather than left ambiguous:** `OverviewCard`
(Progress tab's Weight/Heart/Activity/Nutrition cards) and the trend charts
(`MetricTrendCard`, `ComparisonTrendCard`) still have the previous, more muted look. If
you like this direction, extending it to those is a natural next step — scoped this
round to the highest-visibility screens rather than reskinning everything blind in one
pass.

---

## Verified

`npx tsc --noEmit` and `npx eslint src` both clean.
