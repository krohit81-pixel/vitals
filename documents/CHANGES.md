# Changes — brand logo integration

**Files to add (new):**
- `public/icon-512.png`, `public/icon-192.png`, `public/apple-touch-icon.png`, `public/logo.png`
- `src/components/shared/logo.tsx`
- `src/app/(app)/loading.tsx`

**Files to replace (existing):**
- `src/app/layout.tsx`
- `src/app/(app)/dashboard/page.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/signup/page.tsx`
- `src/components/navigation/sidebar.tsx`

All in `vitals-logo.zip`, paths mirror the repo. No SQL, no new npm dependencies.

---

## What I did with the source image

Your logo photo (`IMG_7988`) is a nice metallic-green mockup on textured paper —
portrait, 735×807. Cropped it to a centered square (the circle logo is centered in the
frame, so this keeps it intact) and generated the four sizes above from that crop:
512px and 192px for the PWA manifest, 180px for iOS home-screen (`apple-touch-icon`),
and 256px for general in-app use (header, auth, sidebar).

I didn't attempt to strip the off-white paper background out from behind the circle —
doing that well needs real background-removal (the shadow/lighting gradients in the
photo would key out messily with a simple color threshold), and it wasn't necessary
anyway: every placement clips the image into a circle via CSS, so only the circular logo
itself ever shows. The paper texture inside the circle actually reads as a nice subtle
letterpress/premium detail rather than a flaw.

## The 5 placements, plus one more

1. **Header, next to the greeting** — `Logo` (48px) added to the left of "Good
   afternoon, Rohit" on Dashboard, 12px gap, sized to roughly match the two-line
   greeting block's height.
2. **App icon / favicon** — `layout.tsx` now has an `icons` metadata block (browser
   tab, bookmarks, iOS home screen via `apple-touch-icon`), and `manifest.json`'s
   `icon-192.png`/`icon-512.png` references now point at real files instead of
   404ing (they were referenced but never actually generated back in Milestone 1).
3. **Splash/loading screen** — new `src/app/(app)/loading.tsx`, using Next's built-in
   `loading.tsx` convention (auto-shown during navigation/data-fetching within the
   authenticated section) — centered logo + "Vitals" below it, per the spec.
4. **Auth screens** — replaced the placeholder green square-with-a-Leaf-icon on both
   Login and Signup with the real logo, same top-center position.
5. **Brand consistency** — one shared `Logo` component (`sm`/`md`/`lg` = 32/48/64px)
   is the single place sizing lives, so every placement stays consistent if you ever
   want to adjust it.

**Bonus (not in the original 5, but the same category of fix):** the desktop sidebar
had that same placeholder green-square-Leaf-icon next to the "Vitals" wordmark — swapped
that for the real logo too, since leaving a fake mark right next to the real one would've
undercut the "consistent branding" goal.

---

## Verified

`npx tsc --noEmit` and `npx eslint src` both clean.
