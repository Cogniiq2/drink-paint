/**
 * Global brand & business configuration.
 * The brand name is referenced everywhere through `site.brand.name` so a rename
 * is a one-line change. Values here are the static defaults; `site_settings`
 * rows in the database override them at runtime (see lib/data/settings.ts).
 */
export const site = {
  brand: {
    name: "BoLaGio Atelier",
    shortName: "BoLaGio",
    /** Used in the wordmark; split so the two words can be styled separately. */
    wordmark: ["BoLaGio", "Atelier"] as const,
    tagline: "Paint & Drink in Bayreuth",
  },
  company: {
    legalName: "BoLaGio GmbH",
  },
  address: {
    street: "Schulstraße 1",
    postalCode: "95444",
    city: "Bayreuth",
    country: "DE",
    countryName: "Deutschland",
    /** Public, non-tracking map links. Coordinates are approximate for the street. */
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Schulstra%C3%9Fe+1%2C+95444+Bayreuth",
    appleMapsUrl: "https://maps.apple.com/?q=Schulstra%C3%9Fe+1,+95444+Bayreuth",
    geo: { latitude: 49.9456, longitude: 11.5775 },
  },
  social: {
    instagramHandle: "bolagioatelier",
    instagramUrl: "https://www.instagram.com/bolagioatelier/",
  },
  contact: {
    /** Placeholder — set the real mailbox before launch. */
    email: "hallo@bolagio-atelier.de",
    phone: null as string | null,
  },
  locale: {
    default: "de-DE",
    timeZone: "Europe/Berlin",
    currency: "EUR",
  },
  ticketing: {
    defaultCapacity: 20,
    /** Development default only; real prices come from each event row. */
    defaultPriceCents: 5400,
    defaultVatRate: 19,
    maxTicketsPerOrder: 6,
    /** Remaining seats ≤ low → "12 von 20 Plätzen frei"; ≤ few → "Noch 3 Plätze". */
    availabilityThresholds: { low: 14, few: 5 },
    defaultMinimumAge: 18,
    doorsBeforeStartMinutes: 30,
  },
  media: {
    heroPoster: "/media/hero-poster.webp",
    heroFilm: "/media/hero-film.mp4",
    heroFilmMobile: "/media/hero-film-mobile.mp4",
    ogDefault: "/media/og-default.webp",
  },
} as const;

export type SiteConfig = typeof site;
