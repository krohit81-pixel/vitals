# Vitals — AI-Powered Nutrition & Health Companion

A premium, mobile-first health app: AI meal logging (photo/voice/text), workout
tracking, weight tracking, Apple Health data import, and an analytics-driven Progress
dashboard with AI-generated insights. Built iteratively across several milestones —
this doc is the entry point for picking development back up in a new session.

**Read this first, then `docs/ARCHITECTURE.md`** for the patterns and conventions this
codebase leans on — several of them exist specifically because getting them wrong
caused real bugs earlier in development, and they're easy to reintroduce if you don't
know the history.

---

## Current state (high level)

- **Auth & shell** — Supabase Auth, bottom nav (mobile) / sidebar (desktop), 5 tabs:
  Dashboard, Meals, Progress, AI Coach, Profile.
- **Meal logging** — photo (Gemini Vision), manual text, voice (Web Speech API), with
  a confidence-based clarification-chip flow when the AI isn't sure about something.
  User-editable quick-add shortcuts (Profile → Meal Shortcuts).
- **Dashboard** — energy balance ring (`Remaining = Target + Burned − Consumed`),
  macro cards, unified daily timeline (meals + workouts), date navigation (day/week/
  month), streak tracking.
- **Workouts** — manual CRUD, 12 types, folded into the same energy-balance math and
  timeline as meals.
- **Weight** — quick-add + history/edit, folded into Progress analytics.
- **Apple Health data** — **not a live sync** (see below) — manual JSON import from
  the HealthSave export app, with cross-source duplicate detection against
  manually-logged workouts.
- **Progress tab** — Health Score ring, AI-generated insights, Weight/Heart/Activity/
  Nutrition overview cards, 7D/30D/90D/1Y range selector, per-metric detail screens,
  achievements.
- **AI Coach** — hero summary + recommendations (LLM-generated), consistency-based
  insight cards with sparklines, weekly rhythm score.
- **Design language** — warm cream / graphite-black theme, emerald primary with a
  diversified per-metric accent palette, glass-card surfaces, vivid gradient rings
  with a slider-thumb marker (Dashboard + Progress hero rings, Milestone-recent).

### Important: Apple Health integration reality

**HealthKit has zero web/browser access on any platform** — this is an Apple platform
constraint, not a limitation of this app. A live "Connect Apple Health" button would
require a native iOS companion app with HealthKit entitlements (a separate project:
Swift, Xcode, App Store review). What's actually built is a **manual JSON import**:
export from the HealthSave iPhone app, upload the file in-app, and the import engine
parses/dedupes/inserts it. An earlier attempt at a Shortcuts-automation bridge was
built and then **removed** when the required Shortcuts actions weren't available on
the test device — see `BACKLOG.md` and `docs/ARCHITECTURE.md` for the full story
before attempting to rebuild anything Apple Health-related.

---

## Stack

- **Next.js 15** (App Router, Server Actions, React 19)
- **TypeScript**, strict mode
- **TailwindCSS** — theme in `tailwind.config.ts` (cream/graphite/emerald tokens)
- **Framer Motion** for micro-interactions and ring animations
- **Recharts** for all charts (bar/area/composed/pie)
- **shadcn/ui-style primitives** — hand-rolled in `src/components/ui`, no CLI dependency
- **Supabase** — Postgres + Auth + Storage, Row Level Security on every table
- **AI provider abstraction** (`src/lib/ai`) — Gemini (default), OpenAI, Claude, all
  behind one interface; swap via `AI_PROVIDER` env var, zero call-site changes
- **lucide-react** for icons

## Setup

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

### 1. Supabase

1. Create a project at supabase.com.
2. **Project Settings → API**: copy the URL, anon key, and service role key into
   `.env.local`.
3. In the SQL Editor, run `supabase/schema.sql` — creates every table, RLS policies,
   the storage bucket, and the signup trigger (auto-provisions `users`/`goals`/
   `meal_shortcuts` for new accounts). **Fully idempotent** — safe to re-run after any
   schema change; always re-run the whole file rather than hand-picking statements.
4. If you're picking up an *existing* Supabase project from before certain features
   existed, check `supabase/backfill_*.sql` for one-time backfill scripts (existing
   users' names, existing users' default meal shortcuts).
5. Email auth is enabled by default under Authentication → Providers.

### 2. Gemini (or an alternate provider)

Get a key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey), set
`GEMINI_API_KEY`. Leave `AI_PROVIDER=gemini` unless you want to swap providers (also
supports `openai` and `claude` — same env-var swap, no code changes).

### 3. Run it

`http://localhost:3000` → lands on `/login`. Create an account, you're in.

## Deploying (Vercel)

1. Push to GitHub, import into Vercel.
2. **Set Root Directory** if the Next.js project isn't at your repo root (common
   source of a confusing "framework not detected" / all-routes-404 issue).
3. Add all `.env.local` values as Vercel environment variables.
4. Deploy — Vercel auto-detects Next.js.

## Project structure

```
src/
  app/
    (auth)/login, (auth)/signup        — public auth routes + Server Actions
    (app)/                             — everything behind auth, wrapped by NavShell
      dashboard/                       — energy ring, macros, timeline, day/week/month
      meals/                           — unified daily timeline (meals + workouts)
        new/                           — capture flow: photo/manual/voice → review → save
        [id]/                          — meal detail/delete
      workouts/                        — manual workout CRUD
      weight/                          — weight history/edit (the *editable* side —
                                          Progress's weight screens are read-only)
      progress/                        — Health Score, insights, overview cards,
                                          per-metric detail screens, range selector
      coach/                           — AI Coach hero + insights + rhythm score
      profile/                         — settings, goals, meal shortcuts, health import
    api/                               — Route Handlers (currently none live — the
                                          Apple Health sync route was removed)
    layout.tsx, globals.css            — root layout, fonts, design tokens
  components/
    ui/                                — Button, Card, Input
    navigation/                        — Sidebar, BottomNav, CaptureSheet, NavShell
    dashboard/, progress/, coach/,     — feature-scoped presentational components
      analytics/, capture/, workouts/,
      meals/, profile/, shared/
  lib/
    ai/                                — provider abstraction (see docs/ARCHITECTURE.md)
    nutrition/                         — the bulk of the domain logic: date math,
                                          consistency scoring, streak logic, range
                                          data-fetching helpers, health-metric import
                                          parsing, workout/meal-type definitions
    supabase/                          — client.ts (browser), server.ts (RSC/actions),
                                          middleware.ts (session refresh + route guard)
    utils.ts
  providers/                           — ThemeProvider, React Query provider
  types/database.ts                    — hand-written Supabase schema types
  middleware.ts                        — delegates to lib/supabase/middleware
supabase/
  schema.sql                           — full schema, RLS, triggers — always re-run whole file
  backfill_*.sql                       — one-time scripts for existing accounts
```

## Docs

- **`docs/ARCHITECTURE.md`** — patterns, conventions, and the specific bug classes this
  codebase has hit before (Server/Client boundary rules, timezone correctness, schema
  ordering) — read before making changes in those areas.
- **`CHANGELOG.md`** — what shipped, in order, milestone by milestone.
- **`BACKLOG.md`** — deferred items and known limitations, with root causes noted where
  already diagnosed.
