"use client";

import { useEffect, useState } from "react";

/**
 * True when running as an installed home-screen PWA (`display: standalone`
 * in `public/manifest.json`). Client-only — no reliable server-side way to
 * know this, same "compute in useEffect, blank/false until mounted" pattern
 * used everywhere else timezone/viewport-dependent state is needed.
 *
 * Why this matters: `window.print()` silently no-ops on iOS when the page is
 * running standalone (launched from the home-screen icon, not inside a
 * Safari tab) — a real WebKit limitation, not something a click handler can
 * work around in place. Real-world symptom: "Export PDF" button does
 * nothing, no error, no dialog. Call sites that offer a PDF export button
 * (Weekly Reports, Blood Pressure) should check this and fall back to
 * opening the page in a real Safari tab instead of calling window.print()
 * directly — see those components for the `<a target="_blank">` fallback,
 * which is what reliably breaks a standalone PWA out into Safari on iOS.
 */
export function useIsStandalone(): boolean {
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    const displayModeStandalone = window.matchMedia?.("(display-mode: standalone)").matches ?? false;
    setStandalone(iosStandalone || displayModeStandalone);
  }, []);

  return standalone;
}
