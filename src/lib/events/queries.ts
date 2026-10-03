import "server-only";
import { getStore } from "@/lib/data";
import { deriveAvailability, type Availability } from "@/lib/inventory/availability";
import type { EventWithAvailability } from "@/lib/data/types";
import { env } from "@/config/env";

export interface EventView {
  event: EventWithAvailability;
  availability: Availability;
}

const view = (event: EventWithAvailability): EventView => ({ event, availability: deriveAvailability(event) });

export async function getUpcomingEvents(limit = 5): Promise<EventView[]> {
  const events = await getStore().listPublishedUpcomingEvents(limit);
  return events.map(view);
}

/** The next evening that is at least visible; prefers bookable ones. */
export async function getNextEvent(): Promise<EventView | null> {
  const list = await getUpcomingEvents(6);
  return list.find((v) => v.availability.bookable) ?? list[0] ?? null;
}

export async function getEventBySlug(slug: string): Promise<EventView | null> {
  const ev = await getStore().getPublishedEventBySlug(slug);
  return ev ? view(ev) : null;
}

/** Launch-safety: env flag AND (optional) db kill-switch must both allow sales. */
export async function isSalesEnabled(): Promise<boolean> {
  if (!env().PUBLIC_SALES_ENABLED) return false;
  const settings = await getStore().getSettings();
  return settings.public_sales_enabled !== false;
}

export async function getSiteSettings() {
  return getStore().getSettings();
}
