"use client";

import type { AnalyticsEvent } from "./events";
import { readConsent } from "./consent";
import { publicFlags } from "@/config/flags";

export interface AnalyticsProvider {
  /** Does this provider need user consent before loading? */
  requiresConsent: "none" | "analytics" | "marketing";
  init(): void | Promise<void>;
  track(event: AnalyticsEvent): void;
}

const consoleProvider: AnalyticsProvider = {
  requiresConsent: "none",
  init() {},
  track(e) {
    if (process.env.NODE_ENV !== "production") console.info("[analytics]", e.name, "props" in e ? e.props : "");
  },
};

/** Plausible (cookieless) — still gated behind analytics consent to be safe. */
const plausibleProvider: AnalyticsProvider = {
  requiresConsent: "analytics",
  init() {
    if (document.querySelector("script[data-plausible]")) return;
    const s = document.createElement("script");
    s.defer = true;
    s.dataset.plausible = "1";
    s.dataset.domain = window.location.hostname;
    s.src = "https://plausible.io/js/script.js";
    document.head.appendChild(s);
  },
  track(e) {
    const w = window as unknown as { plausible?: (n: string, o?: { props?: Record<string, unknown> }) => void };
    w.plausible?.(e.name, "props" in e ? { props: e.props } : undefined);
  },
};

/** Meta Pixel — marketing consent required. Pixel id via NEXT_PUBLIC_META_PIXEL_ID. */
const metaProvider: AnalyticsProvider = {
  requiresConsent: "marketing",
  init() {
    const id = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    if (!id || document.querySelector("script[data-meta-pixel]")) return;
    const s = document.createElement("script");
    s.dataset.metaPixel = "1";
    s.textContent = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView');`;
    document.head.appendChild(s);
  },
  track(e) {
    const w = window as unknown as { fbq?: (...a: unknown[]) => void };
    if (!w.fbq) return;
    if (e.name === "checkout_completed") w.fbq("track", "Purchase", { value: e.props.valueCents / 100, currency: "EUR" });
    else if (e.name === "checkout_started") w.fbq("track", "InitiateCheckout");
    else w.fbq("trackCustom", e.name, "props" in e ? e.props : {});
  },
};

const providers: Record<string, AnalyticsProvider | null> = {
  none: null,
  console: consoleProvider,
  plausible: plausibleProvider,
  meta: metaProvider,
};

export const activeProvider = providers[publicFlags.analyticsProvider] ?? null;
export const providerRequiresConsent = activeProvider ? activeProvider.requiresConsent !== "none" : false;

let initialised = false;
const queue: AnalyticsEvent[] = [];

function allowed(): boolean {
  if (!activeProvider) return false;
  if (activeProvider.requiresConsent === "none") return true;
  const c = readConsent();
  if (!c) return false;
  return activeProvider.requiresConsent === "analytics" ? c.analytics : c.marketing;
}

export function initAnalytics() {
  if (initialised || !activeProvider || !allowed()) return;
  initialised = true;
  void activeProvider.init();
  for (const e of queue.splice(0)) activeProvider.track(e);
}

export function track(event: AnalyticsEvent) {
  if (!activeProvider) return;
  if (!allowed()) return; // never buffer events the user has not consented to
  if (!initialised) {
    queue.push(event);
    initAnalytics();
    return;
  }
  activeProvider.track(event);
}
