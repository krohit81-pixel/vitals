# Architecture & Conventions

This doc exists because several bugs got fixed more than once in this project before
the underlying pattern got written down. Read the "Bug classes" section before working
in any of these areas — it'll save you from reintroducing something already fixed.

---

## Bug classes already hit in this codebase (read this first)

### 1. Server Component → Client Component prop boundary

**The rule:** Next.js Server Components can pass plain data (strings, numbers, arrays,
objects, and *rendered* JSX) to Client Components — but **not** plain functions, and
**not** component references (e.g. an imported icon component like `Beef` from
`lucide-react`, before it's been invoked as `<Beef />`).

**Hit twice:**
- A Server Component passed `formatValue={(v) => v.toFixed(1)}` into a `"use client"`
  chart component → crashed with "Functions cannot be passed directly to Client
  Components." Fixed by replacing the function prop with a serializable string enum
  (`format: "integer" | "oneDecimal"`) and moving the actual formatter function inside
  the client component itself.
- A Server Component passed `icon={Beef}` (the component reference) into a `"use
  client"` card component → same class of crash, because Lucide icons are
  `forwardRef` components, which hit the same serialization wall as plain functions.
  Fixed by changing the prop to `icon: React.ReactNode` and having the **caller**
  render the icon (`icon={<Beef size={14} style={{ color }} />}`) — a rendered element
  is allowed across the boundary; an unrendered component type is not.

**The pattern going forward:** any Client Component that needs an icon takes
`icon: React.ReactNode`, not `icon: LucideIcon`. Any value that varies per-call and
needs to be a function (formatters, comparators) should instead be a string/enum prop
that the Client Component maps to a function *internally*.

### 2. Timezone correctness — server is UTC, users aren't

Vercel functions (and this dev sandbox) run in UTC. Any "what is today" / "what time is
it right now" logic evaluated **server-side** is wrong for anyone not in UTC.

**Established pattern:** `localTodayString()` and the `LocalTime` / `GreetingText` /
`DateNavigator` / `StreakCard` components all compute date/time client-side, inside
`useEffect`, rendering a neutral placeholder (blank, or a rough server-computed guess)
until mounted — this avoids a hydration mismatch (server and client must render the
same thing on first paint) while still ending up correct once the browser's real clock
is available.

**A second, subtler version of this bug:** the HealthSave JSON import. Its timestamps
carry a `Z` suffix — **genuinely UTC**, unlike this app's own-generated timestamps
(already local when created, so reading the literal digits off an ISO string is
correct for *those*). The import parser originally read HealthSave's UTC digits as if
they were already local — wrong by exactly the importer's UTC offset. Fixed by
capturing the browser's IANA timezone (`Intl.DateTimeFormat().resolvedOptions().
timeZone`) at upload time and doing a real UTC→local conversion
(`utcToZonedWallClock()` in `health-import.ts`) instead of digit extraction.

**Takeaway:** before writing any date-string-extraction logic, ask whether the source
timestamp is "already local when created by this app" (safe to read digits directly)
or "a genuine UTC instant from an external source" (needs real conversion).

**Known unresolved gap:** the app has never stored a user's IANA timezone anywhere.
Date navigation's "today" boundary and Dashboard/Progress "day" queries all use a
rough server-side UTC guess for first paint, self-correcting client-side after mount.
This is fine in practice except for a few-hour window around midnight for timezones far
from UTC. See `BACKLOG.md`.

### 3. `supabase/schema.sql` conventions

- **`CREATE TABLE IF NOT EXISTS` is a no-op if the table already exists** — it will
  *not* apply new/changed columns. If you need to change an existing table's shape:
  check (via codebase search) whether anything actually reads/writes that table yet.
  If nothing does, `DROP TABLE IF EXISTS ... CASCADE` then recreate cleanly. If real
  user data could exist, use guarded `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` /
  constraint checks instead.
- **`CREATE POLICY` has no `IF NOT EXISTS`.** Every policy in this file is preceded by
  `DROP POLICY IF EXISTS "name" ON table;` for exactly this reason — re-running the
  script without the drop fails with "policy already exists."
- **Ordering matters** — the script runs top to bottom. Every table must be created
  *before* the RLS section that enables RLS and creates policies on it. (This broke
  once: a table got inserted physically after the RLS section by mistake.)
- **Partial unique indexes can't be used as `ON CONFLICT` targets** by Supabase-js's
  plain column-list `onConflict` option — Postgres needs the same `WHERE` predicate
  repeated in the conflict target, which the JS client has no way to express. Since
  Postgres already treats `NULL` values as distinct from each other in a *plain*
  unique constraint, a partial index is usually unnecessary anyway for "let rows with
  NULL in this column coexist" — just use a plain `UNIQUE (col_a, col_b)` constraint.
- **Always re-run the whole file**, never hand-picked statements — it's written to be
  fully idempotent end to end.

### 4. `average()` lives in `consistency.ts`, not `coach-insights.ts`

Made this exact wrong-import mistake three times across the project (`coach-insights.ts`
imports and uses `average()` internally, which makes it easy to assume it's defined
there). It's re-exported from `coach-insights.ts` now specifically to remove the trap —
but if you're adding a new file that needs it, either import path works; the point is
just to not assume a *third* location.

### 5. Consistency checks need a direction — don't default to "reach the target"

`calcConsistency` / `calcConsistencyDetail` (`src/lib/nutrition/consistency.ts`) take a
`direction: "min" | "max"`. **This was a real, shipped bug** (fixed v0.8.3): every
target-based metric — including calories, carbs, and fat — was checked with "did this
reach at least 80% of target," which meant *eating way over budget still counted as
consistent*. The fix:

- **`"min"`** — protein, fibre, water, steps: a floor. Reaching the target (or getting
  close) is a hit; exceeding it is still fine, unbounded above.
- **`"max"`** — calories, carbs, fat: a budget. Staying at or under the target (with
  ~20% grace) is a hit; exceeding it is the failure mode being tracked.

`calcWeekConsistencyDetails()` in `coach-insights.ts` is the one place all six
nutrition metrics' directions are assigned — treat it as the source of truth rather
than re-deciding direction ad hoc at a new call site. Before adding *any* new
target/goal-based metric anywhere in the app (a new macro, a new health metric with a
daily target, etc.), decide explicitly which direction it is — don't let it silently
default to `"min"`.

### 6. Server-rendered full-bleed elements need exactly one root node

`AppHeader` uses a negative-margin trick (`-mx-4 -mt-6 md:-mx-8 md:-mt-10`) to escape
its parent page's padding and bleed edge-to-edge, and every page renders it as the
*first* child inside a `space-y-N` container. This broke once (v0.8.0): the component
briefly returned a Fragment (`<>...</>`) wrapping two sibling nodes (a fixed compact bar
+ the hero banner) instead of one real `<div>`. React then rendered both as direct
children of the `space-y-N` container, so Tailwind's `space-y` utility (which adds
margin-top to every child after the first) put an unwanted margin on the second node,
breaking the negative-margin cancellation. **Rule:** any component relying on being
"exactly the Nth child" of a `space-y`/`gap` container — for full-bleed tricks,
`:first-child`/`:last-child` selectors, or similar — must return a single real DOM root,
never a Fragment with multiple top-level siblings.

### 7. New tables in `schema.sql` don't reach the live database by themselves

This sandbox has the Supabase anon key and service-role key (for querying data as the
app does), but **no Postgres connection string and no Supabase management token** — so
there's no way to actually run a migration against the live database from here. Adding
a table to `schema.sql` only updates the *source of truth file*; someone still has to
paste the new SQL into the Supabase SQL Editor (or re-run the whole file) for
PostgREST's schema cache to know about it. Symptom if this is missed: `PGRST205 —
Could not find the table 'public.X' in the schema cache` at runtime, even though the
code and `schema.sql` both look correct (hit once with `health_insights` in v0.8.0).
**When adding a new table:** call this out explicitly as a required manual step, don't
assume editing `schema.sql` was sufficient.

### 8. This sandbox can't run a full `next build` — verify with `tsc` + `eslint` instead

A production Next.js build reliably exceeds this environment's per-command timeout,
even with a warm `.next/cache` (confirmed via both foreground and backgrounded attempts
— background processes don't survive between separate tool calls here either). The
working verification gate is `npx tsc --noEmit` + `npx next lint`, both of which
consistently finish and catch the vast majority of real issues; the person running this
locally does the actual `npm run build` themselves before pushing.

---

## AI provider abstraction (`src/lib/ai`)

**Only ever import from `src/lib/ai/index.ts`** (`getAIProvider()`) — never import a
specific provider file (`providers/gemini.ts` etc.) from application code. This is what
makes `AI_PROVIDER=gemini|openai|claude` a zero-code-change swap.

To add a new AI capability:
1. Add the method signature to the `AIProvider` interface in `types.ts`.
2. Add a prompt-building function in `prompts.ts` (keep the "respond with ONLY valid
   JSON, no markdown fences" instruction — every existing prompt does this).
3. Implement the method in **all three** provider files (`gemini.ts`, `openai.ts`,
   `claude.ts`) — they're intentionally symmetric, same method set, same shape.
4. Responses get parsed via `extractJson()` in `json.ts`, which defensively strips
   markdown fences and falls back to finding the first `{...}` block if a model
   doesn't follow instructions perfectly. Reuse it rather than parsing JSON inline.

**Gemini model name**: hardcoded as a constant in `providers/gemini.ts`. Google
deprecates models on a real cadence — this has already broken the app once
(`gemini-2.0-flash` was shut down mid-project). If meal analysis or Coach/Progress
insights start failing, check that constant first before assuming a code bug.

**Clarifying questions are option-based, not yes/no.** `MealAnalysis.
clarifyingQuestions` carries `options: string[]` per question (2-4 concrete choices)
— the prompt explicitly avoids defaulting every ambiguity to a yes/no toggle, since
questions like "does this contain water or milk?" don't have an honest yes/no answer.
`json.ts` has a defensive fallback to `["Yes", "No"]` only if a provider ever omits
options entirely.

**Personal details feed prompts as optional context, never invented.** `UserProfileContext`
(`types.ts`) is folded into both `CoachPromptContext` and `HealthInsightsContext`. The
shared `profileLines()` helper in `prompts.ts` only ever renders fields the user
actually filled in on `/profile/personal-details` — never fabricates an age, activity
level, etc. to fill a gap. If you add a new profile field that should reach the AI,
add it to `UserProfileContext` and `profileLines()` once; both Coach and Progress
Insights pick it up automatically since they share the same builder.

---

## Date & range navigation pattern

Dashboard (`?view=day|week|month&date=YYYY-MM-DD`) and Progress
(`?range=7d|30d|90d|1y`) drive their state through **URL search params**, not
client-only state — pages stay bookmarkable and the back button works correctly.
`DateNavigator`, `PeriodSelector`, and `RangeSelector` are self-contained client
components that read and write these params themselves via `next/navigation`.

**Perf lesson already learned:** the first version of `DateNavigator` rendered blank
and unconditionally redirected to attach a `date` param on every single page load —
even when the guessed date was already correct — forcing a full Server Component
refetch every time. Fixed: render immediately using the same rough guess the server
computes for its own first paint, and only touch the URL if that guess is provably
wrong for the viewer's real timezone. Never re-derive a date the user already
navigated to via prev/next or the calendar picker.

## Data-fetching helper conventions (`src/lib/nutrition/get-*.ts`)

Every range-query helper (`get-range-totals.ts`, `get-workout-totals.ts`,
`get-health-metrics.ts`) **zero-fills every date in the requested range**, even days
with no data — so a chart covering a week with two quiet days never breaks or shows
gaps. Follow this convention for any new range-based data source.

## Server Action conventions

Every mutating action starts with a `requireUser()` helper (fetches the Supabase
server client, checks `auth.getUser()`, throws if unauthenticated) — copy this pattern
rather than inlining the check. Every action that changes displayed data calls
`revalidatePath()` for each route that shows it (commonly `/dashboard`, `/meals`,
and whatever the action's own detail page is).

---

## Design system

- **Palette**: warm cream (`#FAF8F4`) / graphite black (`#18191C`) base, emerald
  (`#10B981`) as primary brand color. Per-metric accent palette is deliberately
  diversified rather than reusing one or two colors everywhere: protein `#8B5CF6`
  (violet), carbs `#3B82F6` (blue), fat `#F59E0B` (amber), fibre `#10B981` (emerald),
  water `#06B6D4` (cyan). Status colors: over-limit `#EF4444` (red), approaching-limit
  `#F59E0B` (amber) — used consistently for the calorie ring, streak misses, etc.
- **Surfaces**: `.glass-card` / `.glass-card-solid` utility classes (see
  `globals.css`) — semi-transparent blurred vs. solid card backgrounds.
  `rounded-2xl` (24px) is the standard card radius.
- **Rings**: `CalorieRing`, `HealthScoreRing` share a visual pattern — multi-stop
  vivid gradient, strong drop-shadow glow tuned per status/tier, and a "slider thumb"
  dot marking the current value's exact position on the arc. The thumb's position is
  computed in the **same raw, pre-`-rotate-90`** SVG coordinate space the
  `stroke-dasharray` arc itself uses (`angle = pct * 2π`, `x = cx + r·cos(angle)`,
  `y = cy + r·sin(angle)`) — placing it in rotated/transformed coordinates directly
  will misalign it from the visible arc end.
- **Icons**: `lucide-react` throughout. Remember the Server/Client boundary rule above
  when passing an icon into any `"use client"` component.
- **Animation**: Framer Motion for ring fills and sheet transitions; keep durations in
  the ~0.15–1.1s range already used (snappy for interactions, ~1.1s for ring
  reveal-on-load).

---

## Dead code that can't be deleted from this sandbox

A recurring, environment-specific issue: files superseded by a redesign sometimes
can't be `rm`'d here (`Operation not permitted` on this mounted folder), so they're
left in place rather than fought over. None of these are imported anywhere live —
verify with a repo-wide search before assuming otherwise, since this list will drift:
`src/components/navigation/top-banner.tsx` (superseded by `app-header.tsx`),
`src/components/progress/overview-card.tsx`, `mini-ring.tsx`, and `bmi-card.tsx`
(superseded by the v0.8.3 Progress redesign's `weight-card.tsx` etc.),
`src/app/(app)/coach/ai-feedback-skeleton.tsx` and
`src/app/(app)/progress/health-insights-skeleton.tsx`, and
`src/components/navigation/floating-controls.tsx` (from the v0.7.3 header design that
was later reverted). If you have real filesystem delete access in your environment,
these are all safe to remove.

---

## Database schema overview

Full source of truth is `supabase/schema.sql` — this is a map, not a substitute for
reading it. Every table has RLS enabled, owner-only policies (via a loop in the SQL
file — add new tables to that loop's array, don't hand-write per-table policies).

| Table | Purpose |
|---|---|
| `users` | Profile info, extends `auth.users`. Auto-created via `handle_new_user()` trigger on signup. Since v0.8.1 also holds the Personal Details fields — `age`, `gender`, `height_cm`, `weight_kg`, `activity_level`, `diet_type`, `allergies`, `units` — editable at `/profile/personal-details`, fed into AI Coach/Progress Insights prompts as optional context and used to compute BMI on Progress. |
| `goals` | Daily targets (calories/macros/water/goal weight). Auto-created on signup with sane defaults. |
| `meal_logs` | Logged meals — items, macros, confidence, AI explanation, source (photo/manual/voice). `logged_at` is user-editable/backdatable (v0.8.2), not locked to insert time. |
| `meal_images` | Storage paths for meal photos (private bucket, signed URLs on read). |
| `daily_totals` | Recomputed from `meal_logs` on every save/edit/delete, for whichever date the meal actually landed on (not always "today," since meals can be backdated) — source of truth is always `meal_logs`, this is a denormalized rollup for fast range queries. |
| `weight_logs` | Weight entries — rebuilt once already (see `CHANGELOG.md`), current shape: `weight`, `unit`, `measured_at`, `notes`. In `schema.sql` it's a `DROP TABLE IF EXISTS ... CASCADE` immediately followed by an unconditional `CREATE TABLE` (not `IF NOT EXISTS`) — deliberate, since a plain `CREATE TABLE IF NOT EXISTS` would silently no-op a shape change on a database that already had the Milestone-1 version of this table. A duplicate, dead `IF NOT EXISTS` create for the old shape used to sit earlier in the file too; removed in v0.8.3 cleanup since the drop+recreate below it always won anyway. |
| `workout_logs` | Manual + imported workouts. `source` (`manual`/`apple_health`) and `health_workout_id` exist specifically so a future real HealthKit integration has somewhere to plug in without a migration. |
| `health_metrics` | Raw imported HealthSave readings (steps, heart rate, HRV, etc.). `metric` is plain text, not an enum — new metric types need zero migration. `recorded_at` (true instant) + `recorded_date` (wall-clock date) are both stored — see timezone section above for why. |
| `meal_shortcuts` | User-managed quick-add phrases for Manual Entry. Seeded with 4 defaults on signup. |
| `settings` | Dark mode, notification prefs. (Also briefly held Apple Health Shortcuts-bridge fields — removed along with that feature; check `CHANGELOG.md` if you see references to it in old docs.) |
| `ai_feedback` | AI Coach's generated summary + recommendations. Written to on-demand (manual "Generate"/"Regenerate" button, not auto-called on page load) via `generateCoachFeedbackAction` — each generation is a new row so the UI can show "last generated at." |
| `health_insights` | Progress tab's "Insights" card — same on-demand/new-row-per-generation pattern as `ai_feedback`, via `generateHealthInsightsAction`. Added in `schema.sql` in v0.7; if you see `PGRST205: could not find the table` at runtime, the live database's schema cache hasn't caught up — see bug class #7 above, this needs a manual step in the Supabase SQL Editor, not a code fix. |

**Dedup patterns worth knowing:**
- `workout_logs`: unique `(user_id, health_workout_id)` — plain constraint, not
  partial (see schema.sql conventions above for why).
- `health_metrics`: unique `(user_id, metric, recorded_at, source)`.
- Cross-source duplicate detection (imported workout vs. already-manually-logged one)
  is a *separate*, fuzzy, application-level check (`isLikelyDuplicateOfManual()` in
  `health-import.ts`) — same day, start time within an hour, compatible type, similar
  duration. Deliberately conservative (tight tolerances) — a missed match just leaves
  an easy-to-delete duplicate; a false-positive match would silently drop a real
  second workout, the worse failure mode.

---

## Things that were built, then removed (don't rebuild blind)

**Apple Health via Shortcuts automation.** Built a personal-sync-token + iOS Shortcuts
bridge (`/api/health/sync`, `/profile/health`) using Apple's documented "Apple Watch
Workout" automation trigger. Removed after confirming (via screenshot) that the
required Shortcuts actions weren't available/discoverable on the actual test device —
two rounds of instruction fixes still didn't resolve it. If revisiting Apple Health
integration, the realistic path is a **native iOS companion app with real HealthKit
entitlements**, not another Shortcuts attempt — see `README.md`'s note on this and
`BACKLOG.md` for the full history.
