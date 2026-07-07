# Changes — simplified Apple Health onboarding

**Files to replace:**
- `src/lib/nutrition/health-sync.ts`
- `src/app/api/health/sync/route.ts`
- `src/app/(app)/profile/health/page.tsx`

All in `vitals-health-simplified.zip`. No SQL changes, no new env vars.

---

## First — why "Get Workouts" wasn't showing up

Confirmed via research, not a guess: Apple consolidated Health-reading actions into a
single **"Find Health Samples"** action (filtered by a Type parameter) some time back.
"Get Workouts" as a distinct action doesn't exist on current iOS — that's exactly why it
was missing on your 26.5 device. My original instructions were wrong. Fixed.

## And — why I can't hand you an importable .shortcut file

Worth repeating plainly since you asked directly: the `.shortcut` format is an
undocumented binary/plist structure, and iCloud share links can only be created by
uploading from the Shortcuts app on a real device — there's no API for either. I have no
way to construct or test one from here, and guessing at the internal structure risks
handing you a file that fails to import. So I redesigned this two ways instead, both of
which are things I *can* actually verify and control:

### 1. Fewer, currently-correct steps

Old (wrong) step 3: "Get Workouts." New: **Find Health Samples** → Type: Workouts →
Start Date: Today. That action has existed across recent iOS versions and is what's
actually in front of you.

### 2. The bigger change — stopped asking Shortcuts to build a dictionary at all

The old design asked you to manually map each workout field (type, date, time, duration,
calories, UUID) into a JSON dictionary inside the Shortcut — the fussiest, most
version-fragile part, and exactly the kind of step that breaks silently when Apple
tweaks something. The new design: **drop the raw Find Health Samples result straight into
the request body.** No field-mapping in Shortcuts at all. All the parsing now happens
server-side in `extractWorkoutFields()`, which:

- Checks several plausible key-name variants for each field (e.g. type might come through
  as `"Workout Type"`, `"Activity Type"`, or just `"Type"` — it tries all of them), since
  Apple doesn't publicly document the exact dictionary shape Shortcuts produces.
- Parses numbers defensively — handles `"450 kcal"` as a string, a plain number, whatever
  comes through.
- Extracts date/time as the literal digits from the date string (regex on the ISO prefix)
  rather than reinterpreting through a `Date` object — avoids a timezone-shift bug, same
  category as ones fixed earlier for meal timestamps.
- Returns `null` (never throws) for anything it can't confidently read, and the sync route
  now reports `{ imported, skipped, total }` so a partial success is visible instead of
  silent.

**Honest limitation:** I still can't verify Apple's *exact* JSON key names without a real
device — nothing publicly documents this. The extractor is built to be tolerant rather
than exact, and the Settings page now explains this directly: if `skipped` stays above 0
on your first real sync, that means a field is labeled differently than expected on your
device, not that something's broken — and it's worth telling me so I can add that
specific variant to the extractor's list.

### Also added

An optional final **Show Result** step in the Shortcut, displaying the sync response —
gives you immediate pass/fail feedback each time it runs, without needing to check the
website.

---

## Verified

`npx tsc --noEmit` and `npx eslint src` both clean. (The actual field-name tolerance can
only really be confirmed against your real device's output — flagged above.)
