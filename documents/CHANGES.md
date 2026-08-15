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

Check `version` in `package.json` — as of this handoff, **`0.8.3`**.

## Requested next: v1.5 (not started — two decisions needed before building)

Rohit asked for this round already, but **no code has been written for it yet** — the
request came in, then the conversation moved on before either open question below got
answered. Don't guess on either one; ask directly, since a wrong guess on the report
content in particular means redoing real work.

His exact wording:

> new section (hamburg menu) on the top.. (next to orbit vxxx) should have:
> - prepare a new tab, this will create weekly reports.. which i can generate pdf
>   extracts.. things that are covered in that week.. what were the key focus areas,
>   key accomplishments and key deliverable for upcoming week.. should be able to
>   view/save pdf.. also option to go back to the app with the back button..
> - add display settings (dark vs light mode)
>
> whenever any process is happening, put the load/in progress ring, so that i know it
> is working..

**1. Hamburger menu — placement is unconfirmed.** "next to orbit vxxx" is almost
certainly a mishearing/typo of "Vitals vX.X.X" (there is no "Orbit" anywhere in this
codebase). But the header's compact bar currently shows a small logo + "Vitals" with
**no version number** — the version only appears in the footer (`Vitals v:X.X.X —
Created by Rohit Kohli`, see `AppFooter`). So "next to Vitals vX.X.X" could mean either:
   - add a version label to the header compact bar and put the hamburger there
     (visible on every tab, most likely intent given "on the top"), or
   - put the hamburger down by the existing version line in the footer instead.

   Ask which one before touching `app-header.tsx` / `app-footer.tsx`.

**2. Weekly Report content is unconfirmed — and worth flagging as a mismatch.** Vitals
is a nutrition/fitness app, but "key focus areas, key accomplishments, key deliverables
for upcoming week" is work/project-status-report language, not fitness-report language.
Three readings, all plausible, not yet picked:
   - **Auto-generated from logged data** — focus areas = which goals were tracked that
     week (calories/protein/steps/etc., same data `calcWeekConsistencyDetails` already
     computes for Progress), accomplishments = achievements/streaks/consistency hit,
     upcoming week = a suggested focus based on this week's weakest metric. Zero typing,
     just Generate → PDF.
   - **Free-form journal** — a form where the user types their own three sections in
     plain text each week; the app only formats it into a PDF. No data pulled in.
   - **Hybrid** — auto-filled draft from logged data (same as option 1), but every
     section is an editable text area before export.

   Also confirm the PDF approach itself — no PDF library is installed yet
   (`package.json` has none). Options range from a print-optimized view + the browser's
   native "Save as PDF" (`window.print()`, zero new dependencies) to a real library
   (`@react-pdf/renderer`, `jspdf`, etc.) if pixel-perfect layout matters more than
   simplicity.

**Already exists — don't rebuild:** dark/light/system theme switching is fully built
(`src/providers/theme-provider.tsx`, persisted, applies the `dark` class app-wide) and
already has a working toggle UI (`src/components/profile/theme-toggle.tsx`) exposed on
the Profile tab today. "Add display settings" most likely just means *surfacing the
existing toggle in the new hamburger menu too* (or moving it there), not building
theme support from scratch — confirm which, but check this before writing any new
theme logic.

**Loading ring on every process** — this is a genuine extension of the existing
convention (see `LoadingRing` in `ARCHITECTURE.md`/`CHANGELOG.md`'s v0.7.1 entry), not
a new pattern. Apply it to whatever's new here specifically: hamburger menu open/close
if it's async, PDF generation/download, and the theme toggle if moved into the menu.

## Outstanding manual step (unverified — check before relying on Progress Insights)

`health_insights` was added to `supabase/schema.sql` in v0.7. Development sandboxes
in this project have never had a Postgres connection string or Supabase management
token — only the anon/service-role API keys — so **new tables in `schema.sql` don't
reach the live database automatically**; someone has to run the SQL in the Supabase
SQL Editor by hand. This was flagged once already (a `PGRST205: could not find table
'public.health_insights'` error while testing v0.8.1) and the fix SQL was handed over
at the time. Whether it was actually run since then isn't verifiable from here (no
network access to Supabase from this environment) — if Progress → "Generate insights"
still errors with `PGRST205`, re-run the whole `supabase/schema.sql` file (it's fully
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
