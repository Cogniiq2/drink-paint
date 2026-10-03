import { site } from "@/config/site";
import type { EventInput } from "./types";

/**
 * Demo evenings for development. These are NOT production content — they
 * exist so the site can be reviewed without a database. Dates are relative to
 * today so the demo never silently goes stale.
 */
function at(daysFromNow: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + daysFromNow);
  // Europe/Berlin is UTC+1/+2; we approximate with +1 for demo data only.
  d.setUTCHours(hour - 1, minute, 0, 0);
  return d;
}

const iso = (d: Date) => d.toISOString();

function evening(opts: {
  slug: string;
  title: string;
  edition: string;
  subtitle: string;
  day: number;
  startHour: number;
  durationH?: number;
  capacity?: number;
  priceCents?: number;
  heroImagePath: string;
  heroImageAlt: string;
  status?: EventInput["status"];
  salesOpenInDays?: number | null;
  description?: string;
}): EventInput {
  const start = at(opts.day, opts.startHour);
  const end = new Date(start.getTime() + (opts.durationH ?? 3) * 3600_000);
  const doors = new Date(start.getTime() - site.ticketing.doorsBeforeStartMinutes * 60_000);
  return {
    slug: opts.slug,
    title: opts.title,
    edition: opts.edition,
    subtitle: opts.subtitle,
    description:
      opts.description ??
      "Ein Abend an einem langen Tisch. Wir beginnen mit einem Glas, dann mit der Leinwand. Niemand muss malen können — die Abfolge führt dich Schritt für Schritt durch das Motiv, und zwischendurch bleibt Zeit für Gespräche, Musik und ein zweites Glas. Am Ende nimmst du dein eigenes Bild mit.",
    startsAt: iso(start),
    endsAt: iso(end),
    doorsAt: iso(doors),
    capacity: opts.capacity ?? site.ticketing.defaultCapacity,
    priceCents: opts.priceCents ?? site.ticketing.defaultPriceCents,
    vatRate: site.ticketing.defaultVatRate,
    minimumAge: site.ticketing.defaultMinimumAge,
    status: opts.status ?? "published",
    salesOpenAt: opts.salesOpenInDays == null ? null : iso(at(opts.salesOpenInDays, 10)),
    salesCloseAt: iso(new Date(start.getTime() - 2 * 3600_000)),
    heroImagePath: opts.heroImagePath,
    heroImageAlt: opts.heroImageAlt,
    maxTicketsPerOrder: site.ticketing.maxTicketsPerOrder,
    lowThreshold: site.ticketing.availabilityThresholds.low,
    fewThreshold: site.ticketing.availabilityThresholds.few,
  };
}

/**
 * A function (not a constant) on purpose: Cloudflare Workers freeze the clock at
 * epoch while modules initialise, so relative dates must be computed per call.
 */
export function buildSeedEvents(): EventInput[] {
  return [
    evening({
      slug: "paint-the-night-no-01",
      title: "Paint the Night",
      edition: "No. 01",
      subtitle: "Eröffnungsabend",
      day: 12,
      startHour: 19,
      heroImagePath: "/media/table-wide.webp",
      heroImageAlt: "Langer Tisch mit Leinwänden und Weingläsern im Atelier",
    }),
    evening({
      slug: "canvas-wine-no-02",
      title: "Canvas & Wine",
      edition: "No. 02",
      subtitle: "Freitagabend",
      day: 26,
      startHour: 19,
      heroImagePath: "/media/wine-pour.webp",
      heroImageAlt: "Rotwein wird in ein Glas gegossen, im Hintergrund eine Leinwand",
    }),
    evening({
      slug: "late-edition-no-03",
      title: "Late Edition",
      edition: "No. 03",
      subtitle: "Samstag, später Beginn",
      day: 41,
      startHour: 20,
      heroImagePath: "/media/brush-detail.webp",
      heroImageAlt: "Pinsel berührt eine frisch grundierte Leinwand",
    }),
    evening({
      slug: "paint-the-night-no-04",
      title: "Paint the Night",
      edition: "No. 04",
      subtitle: "Verkauf startet bald",
      day: 58,
      startHour: 19,
      salesOpenInDays: 20,
      heroImagePath: "/media/finished-art.webp",
      heroImageAlt: "Fertige Leinwände lehnen an einer Wand",
    }),
  ];
}

/** How many seats are already sold in the demo (to exercise every UI state). */
export const seedSold: Record<string, number> = {
  "paint-the-night-no-01": 17, // → "Noch 3 Plätze"
  "canvas-wine-no-02": 8, // → "12 von 20 Plätzen frei"
  "late-edition-no-03": 20, // → sold out
  "paint-the-night-no-04": 0,
};
