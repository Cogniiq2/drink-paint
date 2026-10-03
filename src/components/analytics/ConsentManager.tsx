"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { writeConsent, useConsentSnapshot, isSsrSnapshot, parseConsent } from "@/lib/analytics/consent";

/**
 * Rendered only when a consent-requiring provider is configured. Equal-weight
 * choices, no dark patterns, re-openable via `window.dispatchEvent(new Event('bolagio:consent:open'))`.
 */
export function ConsentManager() {
  const snapshot = useConsentSnapshot();
  const stored = parseConsent(snapshot);
  const [forcedOpen, setForcedOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  useReopenListener(() => setForcedOpen(true));

  const open = !isSsrSnapshot(snapshot) && !dismissed && (forcedOpen || !stored);
  if (!open) return null;

  const decide = (a: boolean, m: boolean) => {
    writeConsent({ analytics: a, marketing: m });
    setForcedOpen(false);
    setDismissed(true);
  };
  const a = forcedOpen && stored ? stored.analytics : analytics;
  const m = forcedOpen && stored ? stored.marketing : marketing;

  return (
    <div role="dialog" aria-modal="false" aria-labelledby="consent-title" className="fixed inset-x-0 bottom-0 z-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
      <div className="mx-auto max-w-xl bg-ivory text-ink border border-hairline-strong rounded-md p-6 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.45)]">
        <h2 id="consent-title" className="font-display text-xl mb-2">
          Cookies & Statistik
        </h2>
        <p className="text-sm text-muted mb-4">
          Technisch notwendige Speicherung ist immer aktiv. Statistik und Marketing laden wir nur mit deiner Zustimmung.{" "}
          <Link href="/datenschutz" className="underline">
            Mehr erfahren
          </Link>
        </p>
        <div className="flex flex-col gap-2 mb-5 text-sm">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={a} onChange={(e) => setAnalytics(e.target.checked)} className="h-4 w-4" /> Statistik
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={m} onChange={(e) => setMarketing(e.target.checked)} className="h-4 w-4" /> Marketing
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button type="button" className="btn btn-outline" onClick={() => decide(false, false)}>
            Nur notwendige
          </button>
          <button type="button" className="btn btn-outline" onClick={() => decide(a, m)}>
            Auswahl speichern
          </button>
          <button type="button" className="btn btn-primary" onClick={() => decide(true, true)}>
            Alle akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}

function useReopenListener(cb: () => void) {
  useEffect(() => {
    window.addEventListener("bolagio:consent:open", cb);
    return () => window.removeEventListener("bolagio:consent:open", cb);
  }, [cb]);
}
