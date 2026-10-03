"use client";

import { useEffect, type ReactNode } from "react";
import { initAnalytics, providerRequiresConsent } from "@/lib/analytics";
import { onConsentChange } from "@/lib/analytics/consent";
import { ConsentManager } from "./ConsentManager";

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initAnalytics();
    return onConsentChange(() => initAnalytics());
  }, []);
  return (
    <>
      {children}
      {providerRequiresConsent && <ConsentManager />}
    </>
  );
}
