# Changes — v0.6.2

**16 files** in `vitals-v0.6.2.zip`, paths mirror the repo.

**One file to delete:**
- `src/components/progress/mini-macro-donut.tsx` (no longer used — Nutrition card
  no longer shows a donut)

No SQL changes, no new dependencies.

---

## 1. Clarifying questions — real options, not forced Yes/No

**Root cause:** the AI prompt literally instructed the model to write "yes/no
clarifying questions," and the UI had a hardcoded Yes/No toggle regardless of what the
question actually was. So "Does this protein shake contain water or milk?" — a real
question with no honest yes/no answer — got a tick/cross anyway.

**Fixed the whole pipeline, not just the UI:**
- `types.ts` — `clarifyingQuestions` now carries `options: string[]` per question, and
  `refineMealAnalysis`'s answer type changed from `"yes" | "no"` to `string`.
- `prompts.ts` — the model is now asked for 2-4 concrete options that actually match the
  ambiguity (`["Water", "Milk", "Both"]`), falling back to Yes/No only when a question
  is genuinely binary (e.g. "Is this decaf?").
- `json.ts` — defensive fallback to `["Yes", "No"]` only if a provider somehow omits
  options, so a malformed response can't render an unanswerable question.
- All three providers (Gemini/OpenAI/Claude) — signature updated to match.
- `meal-review.tsx` — chips now render whatever options came back, as a wrapped row of
  labeled buttons instead of two fixed tick/cross icons.

## 2-5. v0.6.2 backlog items

- **Activity/Nutrition ring visuals removed entirely** — after two fix attempts, per
  your direct call rather than a third attempt. Both cards are text-only now.
- **"57% calories on target" → "57% of days on calorie target"** — same number, clearer
  sentence structure about what it's actually measuring.
- **Insights card redesigned** — each insight is its own row now, with a topic-matched
  icon and accent color (heart/activity/weight/nutrition — matched via lightweight
  keyword detection on the insight text, no schema change needed).
- **Cross-source workout duplicate detection** — imports now check your existing
  *manual* workout entries (not just previously-imported ones) before inserting, and
  skip anything that looks like the same session: same day, start time within an hour,
  compatible type, similar duration. Deliberately conservative — tight enough to avoid
  wrongly dropping a real second workout on the same day. **Verified against 6 test
  cases** (true match, different day, same-day-different-workout, wildly different
  duration, incompatible type, "other" as wildcard) — all passed.
- **The actual timezone bug, fixed and verified:** HealthSave's timestamps carry a `Z`
  suffix — genuinely UTC — but the import parser was reading the literal digits as if
  they were already local time. Now captures your browser's real IANA timezone at
  upload time and does an actual UTC→local conversion.
  - **Verified with a constructed test**: a UTC timestamp designed to cross midnight in
    India — confirmed the old logic got the date wrong, the new logic gets it right.
  - **Re-ran against your actual uploaded export**: the Elliptical workout's time
    corrected from a wrong `13:01` to the accurate `18:31` IST — it was off by over 5
    hours before this fix.

---

## Verified

`npx tsc --noEmit` and `npx eslint src` both clean. Beyond typechecking: the duplicate
matcher and the timezone conversion were both run against real test data (not just
inspected), with results shown above.
