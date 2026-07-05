# Nutri — AI Nutrition & Calorie Tracking App

Milestone 1: project setup, architecture, authentication, navigation, design system, and Supabase integration.

## Stack

- **Next.js 15** (App Router, Server Actions)
- **TypeScript**, strict mode
- **TailwindCSS** + `tailwindcss-animate` — theme in `tailwind.config.ts`
- **Framer Motion** for micro-interactions
- **shadcn/ui**-style primitives (hand-rolled in `src/components/ui`, no CLI dependency)
- **Supabase** — Postgres + Auth + Storage
- **Gemini** as the default AI provider, behind a swappable abstraction (`src/lib/ai`)
- **React Query** for future client-side data fetching (wired in Milestone 2)

## Architecture

```
src/
  app/
    (auth)/login, (auth)/signup     — public auth routes + server actions
    (app)/dashboard, meals,          — authenticated tabs, wrapped by NavShell
         progress, coach, profile
    layout.tsx, globals.css         — root layout, fonts, design tokens
  components/
    ui/                             — Button, Card, Input (shadcn-style primitives)
    navigation/                     — Sidebar, BottomNav, CaptureSheet, NavShell
    dashboard/                      — CalorieRing, MacroCard
    shared/                         — MealCard, EmptyState
    profile/                        — ThemeToggle
  lib/
    supabase/                       — client.ts (browser), server.ts (RSC/actions),
                                       middleware.ts (session refresh + route guarding)
    ai/                             — provider abstraction: types.ts (interface),
                                       prompts.ts, json.ts, providers/{gemini,openai,claude}.ts,
                                       index.ts (factory reading AI_PROVIDER)
  providers/                       — ThemeProvider, React Query provider
  types/                           — database.ts (Supabase schema types)
  middleware.ts                    — root middleware, delegates to lib/supabase/middleware
supabase/
  schema.sql                       — full schema + RLS policies + storage bucket
```

### Why the AI layer is structured this way

Every provider (`GeminiProvider`, `OpenAIProvider`, `ClaudeProvider`) implements the same
`AIProvider` interface. Application code only ever calls `getAIProvider()` from
`src/lib/ai/index.ts` — never a provider file directly. Switching providers is a single
environment variable (`AI_PROVIDER=gemini|openai|claude`), with zero call-site changes.
Gemini is the default per your setup.

### Auth flow

`middleware.ts` refreshes the Supabase session on every request and redirects:
unauthenticated users hitting `/dashboard` etc. → `/login`; authenticated users hitting
`/login` or `/signup` → `/dashboard`. Server Actions in `(auth)/actions.ts` handle sign-in
and sign-up directly against Supabase Auth — no separate API routes needed.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

### 1. Supabase

1. Create a project at supabase.com.
2. In **Project Settings → API**, copy the URL and anon key into `.env.local`.
3. In the SQL Editor, run `supabase/schema.sql` — this creates all 8 tables (`users`,
   `goals`, `meal_logs`, `meal_images`, `daily_totals`, `weight_logs`, `ai_feedback`,
   `settings`), enables Row Level Security so each user only sees their own rows, and
   creates a private `meal-photos` storage bucket.
4. Enable **Email** auth under Authentication → Providers (on by default).

### 2. Gemini

1. Get an API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Set `GEMINI_API_KEY` in `.env.local`. Leave `AI_PROVIDER=gemini`.

### 3. Run it

Visit `http://localhost:3000` — you'll land on `/login`. Create an account, and you're
into the dashboard shell with mock data (real data wiring is Milestone 2).

## Pushing to GitHub

I can't create or push to a GitHub repo on your behalf — that needs your credentials.
From this project folder:

```bash
git add -A
git commit -m "Milestone 1: architecture, auth, navigation, design system, Supabase"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

(Create the empty repo on github.com first, or via `gh repo create <name> --private --source=. --push` if you have the GitHub CLI installed.)

## Deploying to Vercel

1. Push to GitHub (above).
2. Go to vercel.com → **New Project** → import the repo.
3. Add the environment variables from `.env.local` (all of `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AI_PROVIDER`,
   `GEMINI_API_KEY`) in the Vercel project settings.
4. Deploy. Vercel will detect Next.js automatically — no build config needed.

## What's next

- **Milestone 2**: meal logging (manual/photo/voice), wiring the Gemini vision pipeline
  end-to-end, USDA FoodData Central lookups for portion mapping, clarification-chip flow
  for low-confidence detections.
- **Milestone 3**: real dashboard/analytics data, weekly trends, progress tracking, the
  AI Coach's daily/weekly feedback generation, full settings CRUD, deployment polish.
