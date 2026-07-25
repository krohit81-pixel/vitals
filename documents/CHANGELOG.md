# Changelog

Consolidated from each round's individual change notes. Newest first.

## v0.8.0

- **Fixed a production bug**: Progress's "Generate insights" threw
  `PGRST205 — Could not find the table 'public.health_insights'`. The table was
  added to `supabase/schema.sql` in v0.7 but that migration was never applied to the
  live database — this needs a one-time manual step (run the table+RLS-policy SQL in
  the Supabase SQL editor); no code was at fault.
- **Header redesigned again** (open creative pass, no preview shown first) as a
  collapsing large-title, the Apple Music/Health pattern: the big flat hero from
  v0.7.4 is unchanged on first paint, but now compresses/parallaxes as you scroll
  away from it, and once it's scrolled far enough to stop doing useful work, a slim
  frosted compact bar (small logo + "Vitals" + profile button) fades and slides in,
  pinned to the true top — so there's always brand orientation and a way back to
  Profile without the artwork permanently occupying space. Sidebar-aware on desktop,
  safe-area-correct in both states.

## v0.7.4

- **Header simplified back to a flat, full-bleed banner** (per a reference screenshot)
  — dropped the rounded-corner card, shadow, inset margin, and floating-overlap
  controls from v0.7.3; those read as "an image inserted into the UI" rather than
  integrated chrome. Now it's just a tall edge-to-edge image with a soft bottom fade
  into the page background, and each tab's own controls (Day/Week/Month, date
  arrows, range selector) sit in normal page flow below it with ordinary spacing —
  no overlap. Scroll-driven compress/parallax kept.
- **Fixed inconsistent tab-switch loading UI** — `(app)/loading.tsx` (Next's Suspense
  fallback for slow navigations) was a full logo splash, completely different from
  the small ring shown on the tapped nav icon via `useLinkStatus`. Depending on how
  slow a given navigation was, viewers would see one or the other, which felt
  inconsistent/broken. `loading.tsx` now shows the same `LoadingRing` spinner, so
  either mechanism looks like the same loading language.
- **Footer typography**: the version number now renders smaller than the rest of the
  line, and the tagline underneath is now a distinct emerald tint instead of the same
  neutral gray as the credit line.

## v0.7.3

- **Header redesigned to feel like native iOS chrome instead of an inserted image.**
  `AppHeader` is now a rounded (28px), shadowed, slightly inset card — not a
  full-bleed rectangle — with a bottom gradient fade that dissolves the artwork into
  the page's own background, plus a faint (6-7% opacity) blurred color wash behind
  the content that follows, so the transition from vivid artwork to plain background
  no longer feels abrupt.
- **Safe-area aware**: the card's top edge still touches the true top of the screen
  (artwork extends behind the status bar/notch when installed as a PWA), but the
  mobile profile button is offset by `env(safe-area-inset-top)` so it's never hidden
  under it.
- **New `FloatingControls` wrapper** — Dashboard/Meals/Progress's own controls
  (Day/Week/Month, date arrows, the range selector) now live in a rounded white/graphite
  card that overlaps the header's bottom edge by ~18px, the "card floating on the
  hero" depth cue from Apple Fitness/Health, instead of starting flush where the
  artwork ends.
- **Scroll motion**: the header now gently compresses and parallax-drifts (slower
  than the page) as you scroll, rather than holding a fixed size until it's pinned or
  abruptly cut off.

## v0.7.2

- **`AppHeader` now renders the provided `header.PNG` artwork** (full-bleed, fixed
  height, `object-cover`, same on every tab) instead of the gradient + logo/wordmark
  built in v0.7.1 — the artwork already carries the Vitals mark and tagline, so no
  text is overlaid on it except the mobile profile button (frosted white circle, for
  contrast against the busy image regardless of what's underneath it).
- **Tab-specific controls moved back out of the header** and render as normal page
  content directly below it — `PeriodSelector` + `DateNavigator` on Dashboard,
  `DateNavigator` on Meals, `RangeSelector` on Progress — recolored back to their
  original neutral (light/dark) styling since they're no longer sitting on a colored
  background. The header itself stays a fixed, deliberately large height on every tab
  regardless of whether that tab has controls under it.
- **Version number moved to the footer**: "Vitals v:0.7.2 - Created by Rohit Kohli".

## v0.7.1

- **Removed the "Good afternoon, Rohit" greeting** from the Dashboard header — the
  header's identity is now just the app banner (see below).
- **New `AppHeader`**, rendered by every tab (Dashboard, Meals, Progress, Coach,
  Profile) instead of the old thin identity strip: full-bleed gradient banner with
  Logo + "Vitals" + a version badge (`v{package.json version}`, via
  `src/lib/version.ts`) + tagline + the profile menu button on top, and each tab's
  own navigation controls (Day/Week/Month + date arrows on Dashboard, the date arrows
  alone on Meals, the 7d/30d/90d/1y selector on Progress) extended *into* the banner
  below that. Height is fixed (`min-h-[96px]` for the controls row) rather than
  content-driven, so Coach and Profile — which have no controls — reserve the exact
  same blank colored space as tabs that do. That's deliberate: room for a future
  banner photo (meal/workout imagery), not a layout gap.
- Per-page `ProfileMenuButton` instances consolidated into the one in `AppHeader`;
  `PeriodSelector`/`RangeSelector`/`DateNavigator` recolored (white/translucent) since
  they now always render on the gradient rather than a plain background.
- **Loading ring coverage extended app-wide** — `PeriodSelector` (Day/Week/Month) now
  shows the same spinner-on-tap treatment as the range/date selectors from v0.7, and
  bottom-nav / sidebar tab switching now shows a spinner in place of the tapped tab's
  icon via Next's `useLinkStatus()` hook while the next screen loads.
- **New footer** on every tab: "Created by Rohit Kohli" / "Eat right • Move more •
  Live better".

## v0.7

- **New app logo/icon** — replaced with the colorful ring badge (heart-rate ring +
  dumbbell + running figure + watch + water drop), cropped and centered from the
  provided source artwork. Updated `logo.png`, `icon-192.png`, `icon-512.png`,
  `apple-touch-icon.png`. Old assets kept at `public/previous logo/v0.6/`.
- **AI Coach and Progress "Insights" no longer auto-call the LLM on every page
  visit.** Both now show the last generated result (with a "Last generated at ..."
  timestamp) and require an explicit Generate/Regenerate tap. Coach feedback persists
  to the existing `ai_feedback` table (previously defined in schema but never written
  to); Progress insights persist to a new `health_insights` table — **requires running
  the updated `supabase/schema.sql` migration** before this feature works in
  production.
- **Loading indicators for in-place navigation** — Progress's 7d/30d/90d/1y range
  switcher and the day navigator (used on both Dashboard and Meals) now show a
  spinner and disable input while the new period's data loads, via `useTransition`
  wrapping the router navigation. Previously a click gave no feedback until the page
  had already re-rendered.
- **Meals are now editable.** Meal detail page has an Edit action alongside Delete;
  the edit form covers meal type, logged time, and all nutrition fields. Saving
  recomputes `daily_totals` for the affected day(s) — including both the old and new
  day if the edit moved the meal across midnight — and revalidates the same paths the
  save/delete flows already did.
- **Visual pass**: shadows across every card/surface (`shadow-soft`, `shadow-soft-lg`,
  `shadow-glow`) deepened for more visible lift; new `shadow-vivid` token. Added a
  persistent bright gradient (rose → orange → emerald) identity banner above the
  content on every tab.

## Logo update

New gradient ring app icon/logo (replaced the leaf-based one). Source image had a
checkerboard baked into its pixels rather than real alpha transparency — removed via a
saturation+brightness-aware cutout (colorful pixels stay opaque regardless of
brightness, light-grayscale pixels become transparent, dark-grayscale pixels — the
lightning bolt — stay opaque). No code changes; the `Logo` component already read from
the same filenames everywhere.

## v0.6.4

- Fixed `schema.sql` ordering bug (`meal_shortcuts` created after RLS already tried to
  touch it).
- Manual Entry shortcuts now append to existing text instead of replacing it.
- Removed the "N day streak" text label (was mathematically correct — counts
  *consecutive* hits — but confusing next to a dots row showing more total checkmarks
  than the number implied).
- Visual redesign pass: `CalorieRing` and `HealthScoreRing` got richer multi-hue
  gradients, stronger glow, bigger numbers, and a slider-thumb marker. `MacroCard`
  redesigned as a slider (track + fill + thumb), diversified per-metric colors
  (protein violet, water cyan — previously both blue), and fixed a bug where its icon
  color was hardcoded to emerald regardless of the metric. Scoped to these components
  only — `OverviewCard` and the trend charts still have the older look.

## v0.6.3

- **Meal Shortcuts management screen** (`/profile/meal-shortcuts`) — the quick-add
  chips on Manual Entry were hardcoded in source before this; now full add/edit/delete
  per-user data, seeded with the same 4 defaults new signups always got.
- 50-character limit enforced structurally: chips moved from a `whitespace-nowrap`
  pill row (which could only ever fit short phrases) to a fixed-width grid with normal
  text wrapping — can't overflow regardless of label length, not a truncation
  workaround.

## v0.6.2

- Clarifying questions during meal analysis now show real answer options (e.g.
  "Water" / "Milk" / "Both") instead of a forced Yes/No toggle — fixed end-to-end
  (prompt, schema, all 3 AI providers, UI).
- Progress tab: removed the still-overflowing Activity/Nutrition chart visuals per
  explicit instruction, reworded a confusing stat label, redesigned the Insights card
  with topic-matched icons instead of plain paragraphs.
- Cross-source workout duplicate detection on import (see `docs/ARCHITECTURE.md`).
- Fixed a real timezone bug in the HealthSave import: timestamps were UTC (`Z` suffix)
  but were being read as if already local. Verified against the actual export file —
  a workout's time corrected from a wrong 13:01 to the accurate 18:31 IST.

## Milestone 4 — Progress & Health Analytics

- `weight_logs` table rebuilt to the new spec (confirmed unused before dropping/
  recreating). New `health_metrics` table for imported HealthSave data.
- JSON import engine (`/profile/health-import`) — validates, splits into plain metrics
  vs. correlated workout pairs, dedupes, imports. Verified against the real uploaded
  export (2,494 records → 2,488 readings + 3 workouts, zero skipped).
- Weight logging (quick-add + full history/edit).
- Progress dashboard: Health Score ring, AI insights (new `generateHealthInsights()`
  provider method), four overview cards, 7D/30D/90D/1Y range selector, achievements.
- Detail screens: dedicated Weight and Nutrition screens, one generic metric-detail
  route serving Heart/HRV/SpO2/Steps/Distance/Flights instead of four bespoke pages.

## Progress card bug fixes (same round as above)

- Overview card sparklines were overflowing their cards — replaced with bounded SVG
  rings/donuts (can't overflow the way an auto-sizing chart container can).
- Health Score's "vs last period" delta was silently computing "current − 0" when the
  previous period had no data, making it equal the score itself. Fixed to only show a
  real delta when there's real previous-period data, and always show the comparison
  period's date range.

## AI Coach screen build

Hero AI-generated summary (streams in via Suspense, isolated so a slow/failed LLM call
never blocks the rest of the page), recommendations list, weekly rhythm score
(composite consistency score, no "failure" tier), insight cards with sparklines
(pure computation, no LLM), streak tie-in. Chat interface deliberately deferred.

## Date navigator performance fix

Root cause of a 1-2 second load delay: `DateNavigator` rendered blank and
unconditionally redirected to attach a `date` URL param on every load, forcing a full
page refetch even when the guess was already correct. Fixed — see
`docs/ARCHITECTURE.md`'s date navigation section.

## v0.4 — Dashboard/analytics visual redesign

Trend charts switched from area to bar charts with per-day under/over shading, "Under/
Over" headline framing on trend cards (colored per-metric, not a good/bad judgement),
Consumed-vs-Burned rebuilt as grouped bars + a Net total line, a real Streak feature
(a day only counts as a "hit" if something was logged and net calories stayed within a
tolerance — later tightened to zero tolerance, see v0.4 follow-up fixes), Macro Split
card (pie + stacked daily bars).

### v0.4 follow-up fixes
- Ring didn't show the actual over-budget amount (clamped to 0) — fixed, now shows red
  with the real overage; added an amber "approaching" state at ≤200 kcal remaining.
- Streak: switched from a rolling 7-day window to a fixed Monday–Sunday week; "today"
  was being judged on partial data (could flash green early, flip later) — fixed to
  always show as neutral "pending" until the day is actually over. Later, the 5%
  tolerance itself was removed entirely so streak agrees exactly with the ring's
  over/under definition (no more disagreement between the two).

## Apple Health: built, then removed

Personal sync-token + iOS Shortcuts automation bridge, using Apple's documented
"Apple Watch Workout" trigger. Removed after confirming via screenshot that the
required actions weren't available on the actual test device, after two rounds of
attempted instruction fixes. Data model (`workout_logs.source`/`.health_workout_id`)
was deliberately built to survive this removal with zero schema changes — see
`docs/ARCHITECTURE.md`.

Also in this round: `CalorieRing` redesigned with a gradient/glow ring and icon-based
Consumed/Burned/Remaining breakdown (Apple Fitness-inspired, first pass — later
refined further in v0.6.4).

## Milestone 4 — Activity Tracking

Manual workout logging (12 types, full CRUD), energy balance formula
(`Remaining = Target + Burned − Consumed`), unified daily timeline merging meals and
workouts chronologically, exercise-aware analytics (Net Calories, Consumed vs Burned,
Workout Duration/Frequency).

## Milestone 3 — Historical navigation & trends

Date navigation (prev/next + calendar picker) on Dashboard and Meals, Day/Week/Month
views, reusable trend chart components (`MetricTrendCard`), consistency scoring
(`calcConsistency` — % of days hitting ≥80% of target). Established the URL-param-
driven navigation pattern used throughout the rest of the app since.

## v0.3.x — Early bug fixes

Calorie ring text centering (was being centered relative to the ring *plus* the stats
row below it, not just the ring, due to how browsers position absolutely-positioned
flex children); dynamic time-of-day greeting (was hardcoded "Good morning" regardless
of actual time — same timezone-correctness class of bug documented in
`docs/ARCHITECTURE.md`).

## v0.3 — Meal detail, timezone fixes, water logging

Full meal detail page (photo, all items, full nutrient breakdown), Dashboard/Meals
cards linking to it, `LocalTime` component fixing meal timestamps showing in the
server's timezone instead of the viewer's, water logging (quick-add, no LLM involved,
direct DB write) with its own section on the Meals tab.

## Milestone 2 — Meal logging & vision pipeline

Photo/manual/voice capture flows, Gemini vision pipeline, clarification-chip flow for
low-confidence detections, real dashboard/meals data (replacing Milestone 1's mock
data). Several early bug fixes in this window: React 19's `useFormState` →
`useActionState` rename, a Supabase types/generics mismatch, a `useSearchParams`
Suspense-boundary requirement for static builds, and the first Gemini model
deprecation (`gemini-2.0-flash` shut down mid-project — model name is now flagged as a
recurring maintenance point in `docs/ARCHITECTURE.md`).

## Milestone 1 — Foundation

Next.js 15 + TypeScript + Tailwind scaffold, Supabase Auth with session middleware,
bottom nav / sidebar shell, glass-card design system, the AI provider abstraction
(Gemini/OpenAI/Claude behind one interface) built from day one even though only
Gemini was wired up yet, full database schema with RLS.
