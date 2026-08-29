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
   correctness, schema.sql ordering, consistency direction, flexbox squeeze bugs,
   Recharts axis/tick defaults, dead code that can't be deleted from a sandboxed
   environment). Read this before touching any of those areas — several of these bugs
   have been reintroduced more than once by not checking here first.
3. **`documents/CHANGELOG.md`** — newest entries first; read at least the current
   version's entry to know what just shipped.
4. **`documents/BACKLOG.md`** — deferred items and known limitations, so you don't
   propose something already deliberately deferred (or rediscover a limitation that's
   already diagnosed).

## Current version

Check `version` in `package.json` — as of this handoff, **`1.0.0`** (first stable
release — see `CHANGELOG.md`'s v1.0.0 entry).

## Requested next

Nothing open right now — the last standing request (hamburger menu / Weekly Reports /
display settings, originally logged here as "v1.5") shipped in v0.9.0, was revised
twice more based on real usage (v0.9.1, v0.9.5), and is now considered settled — see
`ARCHITECTURE.md` bug class #10 before reopening that design. When Rohit asks for
something new, log it here with his exact wording until it's built, then move the
summary to `CHANGELOG.md` and clear this section back to "nothing open."

## Outstanding manual step (unverified — check before relying on Insights or Weekly Reports)

`health_insights` (v0.7) and `weekly_reports` (v0.9.0) were added to
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

No new tables were added in v0.9.5–v1.0.0 (goal weight reuses the pre-existing
`goals.goal_weight_kg` column), so there's nothing new to add to this list yet — just
the same two tables above, if they haven't already been confirmed live.

## Working conventions worth knowing upfront

- Every round of changes bumps `package.json`'s version and gets a new
  `documents/CHANGELOG.md` entry (prepended, newest first).
- Verification gate is `npx tsc --noEmit` + `npx next lint` — a full `next build`
  reliably times out in this sandbox (see `ARCHITECTURE.md`). The person running this
  locally does `npm run build` themselves before pushing.
- Changes are made directly in the repo; nothing gets delivered as a zip.
- Recent rounds (v0.9.2 onward) have had `git add`/`commit`/`push` done directly when
  asked to ("commit, merge and deploy") — a push to `main` auto-deploys to Vercel
  production via its GitHub integration. Earlier guidance said to leave this to the
  person; default to asking if it's unclear which mode a session is in, but doing it
  when explicitly asked is the established pattern now.
