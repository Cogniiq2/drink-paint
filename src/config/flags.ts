/**
 * Public (browser-safe) feature flags. Server-only flags live in env.ts.
 * NEXT_PUBLIC_* values are inlined at build time.
 */
export const publicFlags = {
  heroFilmEnabled: process.env.NEXT_PUBLIC_HERO_FILM_ENABLED === "true",
  /** When set, a consent manager is rendered before any non-essential script. */
  analyticsProvider: (process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER ?? "none") as
    | "none"
    | "console"
    | "plausible"
    | "meta",
} as const;
