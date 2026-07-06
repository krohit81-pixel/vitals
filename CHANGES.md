# Changes — fix Gemini vision/text pipeline failing on every request

**Files to replace:**
- `src/lib/ai/providers/gemini.ts` — **replace** (attached in `vitals-gemini-model-fix.zip`)

One line changed. No SQL, no other files.

---

## What you saw

The generic red box ("An error occurred in the Server Components render...") on Manual
entry, Photo, and Voice — anything that called the AI. That message itself is expected
behavior: Next.js masks real error text in production builds so server internals don't
leak to the client. The box and "Try again" link you saw are actually *our own*
error-handling UI in `new-meal-flow.tsx` working correctly — it just had nothing more
specific to show, since Next stripped the real message before it got there.

## Root cause

`gemini.ts` had the model hardcoded as `gemini-2.0-flash`. Google shut that model down
on **June 1, 2026**. Every call — manual entry, photo analysis, voice, clarification
refinement, coach feedback — goes through this one `MODEL` constant, so all of them broke
at once, which matches what you saw (Manual entry failing immediately on analyze).

## Fix

```diff
- const MODEL = "gemini-2.0-flash"; // fast + multimodal; swap via env if needed later
+ const MODEL = "gemini-2.5-flash"; // gemini-2.0-flash was shut down by Google June 1, 2026
```

`gemini-2.5-flash` is Google's current recommended stable replacement.

## What to do

1. Replace `src/lib/ai/providers/gemini.ts` with the attached version.
2. Redeploy.
3. Try the same manual entry again — should analyze normally now.

## Worth knowing for later

Model names in this space move fast — Google's deprecation cadence has been every few
months this year. If a similar error shows up again down the line, check
`src/lib/ai/providers/gemini.ts`'s `MODEL` constant first, before assuming it's a code bug.
Since I don't have live visibility into your running app, I can't catch this proactively —
if a capture flow ever stops working, that constant (or Google's model-deprecations page)
is the first place to look.
