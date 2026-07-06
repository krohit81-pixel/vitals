# Changes

## Fix: build error on `/meals/new` — `useSearchParams()` needs a Suspense boundary

**Error you hit:**
```
⨯ useSearchParams() should be wrapped in a suspense boundary at page "/meals/new"
Error occurred prerendering page "/meals/new"
```

**Why:** `next build` tries to statically render every page it can. `useSearchParams()` depends on the actual request URL, which doesn't exist at build time — so Next needs a `<Suspense>` boundary around anything that calls it, as a signal for "render this part per-request, not at build time." `next dev` doesn't enforce this, which is why it only showed up once you ran `npm run build`.

**Fix applied:** split `src/app/(app)/meals/new/page.tsx` in two:

- **`new-meal-flow.tsx`** (new file) — all the existing client logic, moved here verbatim. Only change: `export default function NewMealPage()` → `export function NewMealFlow()`.
- **`page.tsx`** (rewritten) — now just a thin wrapper:

```tsx
import { Suspense } from "react";
import { NewMealFlow } from "./new-meal-flow";

export default function NewMealPage() {
  return (
    <Suspense fallback={<div className="skeleton h-64 w-full" />}>
      <NewMealFlow />
    </Suspense>
  );
}
```

### What to do

1. In your repo, create `src/app/(app)/meals/new/new-meal-flow.tsx` with the full content of your current `page.tsx`, but change the export line at the top from
   `export default function NewMealPage() {` to `export function NewMealFlow() {`.
2. Replace `src/app/(app)/meals/new/page.tsx` with the wrapper above.
3. `npm run build` again — should pass cleanly now.

No other files changed, no other pages affected (this was the only spot using `useSearchParams`).
