# Vitals — Backlog

Items mentioned as "later"/"future" during development, kept here so they don't get lost.
Not yet built. Move items into an actual milestone/version when ready to build.

## Shipped in v0.4

- Week/Month trend charts switched from area charts to **bar charts** — each bar shaded
  by whether that day crossed target.
- Every trend card's header redesigned around an **Under/Over** framing (e.g. "118
  under", "6 over"), colored per-metric, plus "X of Y avg/day" underneath — mirrors a
  budget-gauge feel instead of a plain average.
- Consumed vs Burned chart rebuilt as grouped bars **plus a Net total line** overlaid —
  shows consumed, burned, and the resulting total together per day, not just two
  separate series.
- **Streak card** — real computation (not decorative): a day counts as a "hit" if
  something was logged and net calories stayed within 5% of target; shows current streak
  length and the last 7 days as checkmark dots. Always reflects the 7 days ending on
  whichever date is being viewed.
- **Macro Split card** — pie chart (average Fat/Carbs/Protein proportion) + stacked daily
  bars + inline percentages, added to the Week/Month Nutrition section.

## Shipped in Milestone 4 (Progress & Health Analytics)

- **`weight_logs` rebuilt** to match this milestone's spec (weight/unit/measured_at/notes)
  — the Milestone 1 version of this table was dead schema, never wired to any UI,
  confirmed via full codebase search before dropping and recreating it.
- **`health_metrics`** — new table for imported HealthSave data. `metric` is plain text,
  not an enum, specifically so new metric types (sleep, VO2 max, blood pressure, ...)
  can start flowing in later with zero migration, per the spec's "future additions
  without redesign" requirement.
- **JSON import engine** (`/profile/health-import`) — validates a HealthSave export,
  splits it into plain metrics vs. workout pairs (correlated by matching timestamp +
  source, with workout type parsed from the source string), dedupes via a unique
  constraint, and imports real workouts straight into the existing `workout_logs` table
  (reusing the `apple_health` source/dedup design from the earlier Activity Tracking
  milestone). **Verified against your actual export file**, not just typechecked: 2,494
  records → 2,488 metric readings + 3 correctly-paired workouts, zero skipped.
- **Weight logging** — quick-add via the `+` sheet (current/previous/diff shown inline,
  per the spec's example), full edit/delete history at `/weight`.
- **Progress dashboard rebuilt**: Health Score ring (composite of nutrition/activity
  consistency, gracefully degrading when a signal has no data yet), AI-generated
  insights (new `generateHealthInsights()` across all three providers — Gemini/OpenAI/
  Claude — mirroring the existing Coach feedback pattern), four overview cards (Weight/
  Heart/Activity/Nutrition) with sparkline + trend + comparison, a 7D/30D/90D/1Y range
  selector, and a small achievements row.
- **Detail screens**: dedicated Weight screen (chart, current/goal/lost/BMI/weekly-
  monthly averages, projected goal date) and Nutrition screen (reuses `MacroSplitCard`
  and `MetricTrendCard` from earlier milestones) — plus **one generic metric-detail
  route** (`/progress/metric/[metric]`) serving heart rate, HRV, SpO2, steps, distance,
  and flights, rather than four separate bespoke pages.

**Scope decisions made transparently, not silently:**
- The spec asked for dedicated Heart and Activity *screens*; built as the one generic
  metric-detail route above instead, reached by tapping through from the overview cards.
  Same visual result per metric (matches your reference screenshots' layout exactly),
  less code duplicated per metric — but if you specifically want a combined Heart screen
  showing RHR+HRV+SpO2 together on one page (rather than one-metric-at-a-time), that's a
  reasonable follow-up.
- Achievements are a small, fixed set of deterministic checks (steps, streak, protein
  consistency, active week, weight-goal progress) — not a full badge/gamification system.
- Health Score's formula is a first pass (nutrition + activity consistency only) — it
  deliberately doesn't try to score heart-rate metrics as "good/bad," since that edges
  toward medical judgment the app isn't qualified to make. Worth revisiting the exact
  weighting once there's real usage data to tune against.

## Shipped in Milestone 4 (Activity Tracking)

- Manual workout logging — full CRUD (`/workouts/new`, `/workouts/[id]`), 12 workout
  types, edit/delete for manually-entered workouts.
- Energy balance on Dashboard: `Remaining = Target + Burned − Consumed`, `CalorieRing`
  redesigned with a gradient/glow ring and an icon-based Consumed/Burned/Remaining
  breakdown (Apple Fitness–inspired).
- Unified daily timeline — Meals tab now interleaves meals and workouts chronologically
  by time, instead of grouping meals by type.
- Exercise analytics — Net Calories, Consumed vs Burned comparison, Workout Duration,
  Workout Frequency, all in Week/Month trend views, using the same reusable chart
  components from Milestone 3.

**Apple Health: attempted, then rolled back by product decision.** Built a personal
sync-token + iOS Shortcuts bridge, but the required Shortcuts actions ("Get Workouts,"
then "Find Health Samples") weren't available/discoverable on the actual test device
(iOS 26.5) — confirmed via screenshot, not just a hunch. Rather than keep patching
instructions against a moving, unverifiable target, removed the feature's UI and API
surface entirely (`/profile/health`, `/api/health/sync`, the sync-token logic).

**The data model was deliberately built to survive this rollback with zero schema
changes**: `workout_logs.source` (`manual` | `apple_health`) and `.health_workout_id`
(dedup key) are still there, unused for now. Whenever Apple Health support is worth
revisiting — most realistically via a native companion app with real HealthKit
entitlements, not a Shortcuts workaround — it plugs into the exact same table and the
exact same dedup logic, no migration required.

## Shipped in Milestone 3

- ~~Date navigation on Dashboard and Meals~~ → prev/next arrows + calendar-picker
  (`DateNavigator`), URL-driven (`?date=YYYY-MM-DD`), reusable across both pages.
- ~~Dashboard Today/Week/Month views~~ → `PeriodSelector` + `TrendsView`, sharing one
  `getDailyTotalsRange()` data helper and one `MetricTrendCard` component per metric.
- ~~Trend charts for calories, protein, carbs, fat, fibre, water~~ → `MetricTrendCard`
  (recharts-based), built generically (label/unit/color/data/target props only, no
  nutrition-specific logic) so weight tracking or any future metric can reuse it as-is.
- Consistency scoring (`calcConsistency`) — % of days hitting ≥80% of target — used as the
  small KPI badge on each trend card instead of long text summaries, per the "charts over
  text" direction.

**Known limitation carried over, not fixed this round:** the day-boundary issue noted
below (server's UTC clock vs. your local midnight) also applies to week/month range
boundaries now — e.g. `startOfWeek`/`startOfMonth` compute against whatever anchor date
they're given, so if that anchor itself was ever off by a day near midnight, the whole
week/month range shifts with it. Same root fix as below (store user's IANA timezone)
would resolve this for date navigation too, not just single meal timestamps.

## Shipped in 0.3

- ~~Meals tab: show full meal details~~ → `/meals/[id]` detail page (photo, all
  detected items, full nutrient breakdown, AI explanation, confidence, delete).
- ~~Dashboard → tap a meal → its full detail~~ → both Dashboard and Meals tab cards
  now link to `/meals/[id]`.
- ~~Meal log shows wrong (server) timezone~~ → `LocalTime` component renders
  client-side in the viewer's actual timezone.
- Water logging (no LLM) — quick add via the `+` sheet, plus its own section on the
  Meals tab, separate from the Breakfast/Lunch/Dinner/Snack groups.

## Unscheduled (mentioned, no version assigned yet)

- **Auto-calculate calorie/macro goals from a goal weight**, instead of manually typing
  targets on `/profile/goals`. Needs a formula decision first (activity level × goal
  weight × timeline, e.g. Mifflin-St Jeor or similar) before it's buildable.
- **Date history browsing** — dashboard and meals currently always show "today"
  (`new Date()` hardcoded in page queries). Eventually needs a date picker whose
  selected date flows into those queries instead. `formatFriendlyDate()` in
  `src/lib/nutrition/date.ts` is the one spot that'll need to become date-picker-aware.
- **"Today" boundary uses the server's UTC clock, not your local midnight.** Related to
  the timezone display bug fixed in 0.3, but not the same thing: a meal logged between
  midnight and ~5:30am IST could theoretically land under the wrong day's totals, since
  `startOfTodayISO()` computes midnight using the server's timezone (UTC on Vercel), not
  yours. Low-impact in practice (most people aren't logging meals at 2am), but the
  correct fix is to capture and store each user's IANA timezone (e.g. on signup, via
  `Intl.DateTimeFormat().resolvedOptions().timeZone` in the browser) and use it
  server-side for day-boundary math — same category of fix as date-picker history above,
  worth doing together.

---

*Add to this file directly, or just mention something's "for later" in conversation —
I'll add it here.*
