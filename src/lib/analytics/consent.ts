"use client";

export type ConsentState = { analytics: boolean; marketing: boolean; decidedAt: string } | null;

const KEY = "bolagio.consent.v1";
const EVENT = "bolagio:consent";

export function readConsent(): ConsentState {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ConsentState) : null;
  } catch {
    return null;
  }
}

export function writeConsent(state: { analytics: boolean; marketing: boolean }) {
  const next = { ...state, decidedAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage blocked: consent is session-only */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
}

export function clearConsent() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: null }));
}

export function onConsentChange(cb: (s: ConsentState) => void) {
  const handler = (e: Event) => cb((e as CustomEvent<ConsentState>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

import { useSyncExternalStore } from "react";

const SSR = "__ssr__";
function subscribe(cb: () => void) {
  const off = onConsentChange(cb);
  window.addEventListener("storage", cb);
  return () => {
    off();
    window.removeEventListener("storage", cb);
  };
}
function getSnapshot(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Raw stored consent (string | null) or the SSR sentinel before hydration. */
export function useConsentSnapshot(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => SSR);
}
export const isSsrSnapshot = (s: string | null) => s === SSR;
export function parseConsent(raw: string | null): ConsentState {
  if (!raw || raw === SSR) return null;
  try {
    return JSON.parse(raw) as ConsentState;
  } catch {
    return null;
  }
}
