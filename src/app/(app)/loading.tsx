import { LoadingRing } from "@/components/shared/loading-ring";

/**
 * Next's Suspense fallback for this route segment — shown when a navigation
 * is slow enough that the tapped nav item's own `useLinkStatus` spinner
 * (bottom-nav.tsx / sidebar.tsx) isn't the only thing the viewer sees before
 * the new page commits. Previously this was a full logo splash, which read
 * as a completely different, jarring loading UI depending on which of the
 * two mechanisms happened to fire for a given navigation. Using the same
 * ring here means the loading language is consistent no matter which one
 * shows.
 */
export default function AppLoading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-cream dark:bg-graphite">
      <LoadingRing size={32} className="text-emerald-500 dark:text-emerald-400" />
    </div>
  );
}
