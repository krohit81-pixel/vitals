# Vitals — Backlog

Deferred items and known limitations only. **For what's already shipped, see
`CHANGELOG.md`** — this file used to mix both together, which got confusing about
which one was current; now it's just the "not built yet" list. **For what's actively
requested next**, see `CHANGES.md` — as of v1.0.0 there's no open ask sitting there;
the last one (hamburger menu / Weekly Reports / display settings) shipped, iterated
through v0.9.1 and v0.9.5, and is documented as settled in `ARCHITECTURE.md` bug
class #10.

---

## Unscheduled

- **Auto-calculate calorie/macro goals from a goal weight**, instead of manually typing
  targets on `/profile/goals`. Needs a formula decision first (activity level × goal
  weight × timeline, e.g. Mifflin-St Jeor or similar) before it's buildable. Goal
  weight itself is now settable (`/profile/personal-details`, v1.0.0) — this item is
  specifically about deriving the *other* targets from it, not about capturing it.

- **Store each user's IANA timezone** (e.g. captured client-side via
  `Intl.DateTimeFormat().resolvedOptions().timeZone` at signup) — the one real fix that
  would resolve several related-but-distinct edge cases at once: the day-boundary issue
  below, week/month range boundaries in date navigation, and would let future date-math
  be done server-side with confidence instead of always deferring to a client-side
  correction pass. See `docs/ARCHITECTURE.md`'s timezone section for full context.

- **"Today" boundary uses the server's UTC clock, not your local midnight.** A meal
  logged between midnight and ~5:30am IST could theoretically land under the wrong
  day's totals, since day-boundary math computes using the server's timezone (UTC on
  Vercel), not yours. Low-impact in practice (most people aren't logging at 2am), but
  see the timezone-storage item above for the real fix. Also applies to
  `startOfWeek`/`startOfMonth` in date navigation and Progress's range queries — same
  root cause everywhere it shows up.

- **Cross-source workout duplicate detection is application-level fuzzy matching, not
  guaranteed-correct.** Works well for the common case (same day, close time,
  compatible type, similar duration — see `docs/ARCHITECTURE.md`), but it's a
  heuristic, not a certainty. If false negatives (missed duplicates) or false positives
  (wrongly-skipped real workouts) show up in practice, the tolerances in
  `isLikelyDuplicateOfManual()` (`health-import.ts`) are the place to tune.

- **`ComparisonTrendCard` and `MacroSplitCard` still have the earlier, more muted
  visual treatment** — everything on the Progress tab itself was redesigned in v0.8.3
  (Health Score breakdown, Weight/BMI, Heart Rate, Activity, Nutrition Consistency,
  Achievements), and Dashboard's `CalorieRing`/`MacroCard` got the vivid-gradient
  treatment earlier, but the comparison/split charts on Dashboard haven't been
  revisited. Natural next step if the newer direction is working well.

- **Achievements are a small fixed set of deterministic checks**, not a full badge/
  gamification system (10k steps, 5-day streak, protein-goal-7-days, active week,
  weight-goal-50%). Extend `computeAchievements()` in `achievements.ts` for more.

- **Health Score formula only weighs nutrition/activity consistency** (calories,
  protein, fibre, and steps when available — see the breakdown card on Progress for
  exactly which ones and why). Deliberately doesn't try to score heart-rate metrics as
  "good/bad," since that edges toward medical judgment the app isn't positioned to
  make. Worth revisiting the exact weighting (and whether carbs/fat/water should count
  toward the score too, not just the separate Nutrition Consistency card) once there's
  real usage data to calibrate against.

- **BMI is shown as a single "Underweight/Normal/Overweight/Obese" badge with no
  further framing.** Standard categories, no per-user context (e.g. athletes with high
  muscle mass, pregnancy, etc.) — fine for a general-audience app, but worth a caveat
  in the UI copy if this ever gets scrutiny. Not currently linked to any coaching
  behavior; it's informational only on the Weight card.

- **`get-weight-series.ts` assumes one weight unit per user for charting** — mixing
  kg and lb entries within the same period would plot inconsistently on the Weight
  card's sparkline. Not currently possible from the UI (unit is a per-entry field, but
  in practice everyone sticks to their profile's preferred unit), but there's no
  guard against it.

- **AI Coach's "Ask Coach" chat interface** — explicitly deferred in favor of the
  static/visual pieces (hero summary, insight cards, rhythm score) first. The AI
  provider abstraction already supports adding this (see `docs/ARCHITECTURE.md`); it's
  a new `AIProvider` method + a chat UI, not an architecture change.

## Apple Health — do not rebuild the Shortcuts bridge

Already attempted and removed once (see `CHANGELOG.md`) after confirming the required
Shortcuts actions weren't available on the actual test device, across two rounds of
instruction fixes. The data model (`workout_logs.source`/`.health_workout_id`) still
supports plugging in a real integration with zero migration. If this comes up again,
the realistic path is a **native iOS companion app with actual HealthKit
entitlements** — a genuinely separate project (Swift/Xcode/App Store review), not
another attempt at the web-based Shortcuts workaround.

---

*Add to this file directly, or just mention something's "for later" in conversation —
it'll get added here. When something ships, move its entry to `CHANGELOG.md` instead
of leaving it here marked as done — keeps this file meaning what it says.*
