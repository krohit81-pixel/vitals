# Start here for a new session

This file used to be a per-round handoff note that accompanied a zip of changed files
(`vitals-v0.6.4.zip` etc.). That workflow isn't used anymore — changes are made
directly in this repo, round by round, and recorded in `CHANGELOG.md` as they ship.
This file is now just the entry point: what to read, in what order, and what (if
anything) still needs a manual step before new work.

## Read in this order

1. **`README.md`** (repo root) — what the app is, current feature set, stack, setup.
2. **`documents/ARCHITECTURE.md`** — patterns and conventions, and the specific bug
   classes this codebase has already hit (Server/Client boundary rules, timezone
   correctness, schema.sql ordering, consistency direction, dead code that can't be
   deleted from a sandboxed environment). Read this before touching any of those areas
   — several of these bugs have been reintroduced more than once by not checking here
   first.
3. **`documents/CHANGELOG.md`** — newest entries first; read at least the current
   version's entry to know what just shipped.
4. **`documents/BACKLOG.md`** — deferred items and known limitations, so you don't
   propose something already deliberately deferred (or rediscover a limitation that's
   already diagnosed).

## Current version

Check `version` in `package.json` — as of this handoff, **`0.9.0`**.

## Requested next: v1.5 — shipped in v0.9.0

The hamburger menu / Weekly Reports / display-settings request below was answered
directly by Rohit (menu in the header compact bar; report content auto-generated from
logged data, deterministic, no AI call; PDF via `window.print()`; theme toggle moved
into the new menu, not duplicated) and built — see `CHANGELOG.md`'s v0.9.0 entry for
what actually shipped. Original request preserved here for reference:

> new section (hamburg menu) on the top.. (next to orbit vxxx) should have:
> - prepare a new tab, this will create weekly reports.. which i can generate pdf
>   extracts.. things that are covered in that week.. what were the key focus areas,
>   key accomplishments and key deliverable for upcoming week.. should be able to
>   view/save pdf.. also option to go back to the app with the back button..
> - add display settings (dark vs light mode)
>
> whenever any process is happening, put the load/in progress ring, so that i know it
> is working..

**Outstanding manual step**: `weekly_reports` (new table, v0.9.0) needs the same
Supabase SQL Editor step called out below for `health_insights` — see that section,
same root cause, now two tables waiting on it if neither has been run yet.

## Outstanding manual step (unverified — check before relying on Progress Insights or Weekly Reports)

`health_insights` (v0.7) and now `weekly_reports` (v0.9.0) were added to
`supabase/schema.sql`. Development sandboxes in this project have never had a Postgres
connection string or Supabase management token — only the anon/service-role API keys —
so **new tables in `schema.sql` don't reach the live database automatically**; someone
has to run the SQL in the Supabase SQL Editor by hand. This was flagged once already for
`health_insights` (a `PGRST205: could not find table 'public.health_insights'` error
while testing v0.8.1) and the fix SQL was handed over at the time. Whether it was
actually run since then isn't verifiable from here (no network access to Supabase from
this environment) — if Progress → "Generate insights" or Weekly Reports → "Generate
report" errors with `PGRST205`, re-run the whole `supabase/schema.sql` file (it's fully
idempotent, safe to re-run end to end) in the Supabase SQL Editor.

## Working conventions worth knowing upfront

- Every round of changes bumps `package.json`'s version and gets a new
  `documents/CHANGELOG.md` entry (prepended, newest first).
- Verification gate is `npx tsc --noEmit` + `npx next lint` — a full `next build`
  reliably times out in this sandbox (see `ARCHITECTURE.md`). The person running this
  locally does `npm run build` themselves before pushing.
- Changes are made directly in the repo; nothing gets delivered as a zip.
- `git add` / `commit` / `push` are left for the person to run themselves — not run
  automatically.
