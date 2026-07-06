# Vitals — Backlog

Items mentioned as "later"/"future" during development, kept here so they don't get lost.
Not yet built. Move items into an actual milestone/version when ready to build.

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
