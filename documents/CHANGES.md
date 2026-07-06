# Changes — photo library upload fix + analyzing progress bar

**Files to add (new):**
- `src/lib/nutrition/image-resize.ts`
- `src/components/capture/analyzing-progress.tsx`

**Files to replace (existing):**
- `src/components/capture/photo-capture.tsx`
- `src/app/(app)/meals/new/new-meal-flow.tsx`

All in `vitals-photo-fix.zip`, paths mirror the repo. No SQL changes.

---

## 1. Photo library upload failing ("peri peri rice" error)

**I can't see your server logs, so I can't confirm the exact error** — but this matches
the same masked-error pattern as the Gemini model issue a few rounds back (Next.js hides
the real message in production). Two things commonly cause exactly this when the photo
comes from the **library** rather than a fresh camera capture, and I've fixed both at once
rather than guessing which one it was:

1. **Size.** A photo you just took with "Take Photo" is one shot; your photo library can
   contain full-resolution originals — often 5-15MB. Base64-encoding for the Server Action
   adds ~33% on top of that, which can exceed request-size limits.
2. **Format.** iPhones default to HEIC for library photos. That was being passed straight
   through as the file's real MIME type to Gemini — HEIC handling isn't as universally
   solid as JPEG across every part of that pipeline.

**Fix:** `image-resize.ts` — before anything gets sent anywhere, the photo is drawn onto
an in-browser canvas, downscaled to a max 1280px edge, and re-encoded as JPEG at 85%
quality. This makes every photo small and in a known-good format regardless of source —
camera or library, HEIC or not. `photo-capture.tsx` now calls this and shows a brief
"Processing photo…" state while it happens (it's fast, but real-resolution photos aren't
instant to redraw).

If you hit this again on a *specific* photo after this fix, that'd be a genuinely new
issue rather than this same one — worth flagging separately if so.

## 2. Analyzing progress indicator

New `AnalyzingProgress` component — animated ring that eases up toward ~92% while
waiting, with status text that cycles ("Uploading photo…" → "Identifying foods…" →
"Estimating nutrition…" → "Double-checking portions…", worded differently for manual/voice
entry vs. photo). It deliberately never claims 100% on its own — there's no real
progress signal from a single AI call, so it stops short and only actually completes once
the real result comes back and the screen moves on to Review. Replaces the old static
skeleton + "Analyzing your meal…" text.

---

## Verified

`npx tsc --noEmit` and `npx eslint src` both clean.
