import type { EventWithAvailability } from "@/lib/data/types";

export type AvailabilityState = "available" | "low" | "few" | "sold_out" | "coming_soon" | "closed" | "past";

export interface Availability {
  state: AvailabilityState;
  remaining: number;
  capacity: number;
  /** Short German label for placards and lists. */
  label: string;
  /** Can a seat be booked right now (ignoring the global sales flag)? */
  bookable: boolean;
  /** Should the waitlist be offered? */
  waitlist: boolean;
}

/**
 * Pure function: derives the customer-facing availability from real inventory
 * and the event's own thresholds. No randomness, no timers, no invented numbers.
 */
export function deriveAvailability(event: EventWithAvailability, now: Date = new Date()): Availability {
  const remaining = Math.max(0, event.remaining);
  const capacity = event.capacity;
  const start = new Date(event.startsAt);
  const salesOpen = event.salesOpenAt ? new Date(event.salesOpenAt) : null;
  const salesClose = event.salesCloseAt ? new Date(event.salesCloseAt) : null;

  const base = { remaining, capacity };

  if (start.getTime() < now.getTime()) {
    return { ...base, state: "past", label: "Vorbei", bookable: false, waitlist: false };
  }
  if (event.status !== "published") {
    return { ...base, state: "coming_soon", label: "Bald", bookable: false, waitlist: true };
  }
  if (salesOpen && salesOpen.getTime() > now.getTime()) {
    return { ...base, state: "coming_soon", label: "Verkauf startet bald", bookable: false, waitlist: true };
  }
  if (salesClose && salesClose.getTime() < now.getTime()) {
    return { ...base, state: "closed", label: "Verkauf beendet", bookable: false, waitlist: false };
  }
  if (remaining === 0) {
    return { ...base, state: "sold_out", label: "Ausverkauft", bookable: false, waitlist: true };
  }
  if (remaining <= event.fewThreshold) {
    return {
      ...base,
      state: "few",
      label: remaining === 1 ? "Noch 1 Platz" : `Noch ${remaining} Plätze`,
      bookable: true,
      waitlist: false,
    };
  }
  if (remaining <= event.lowThreshold) {
    return {
      ...base,
      state: "low",
      label: `${remaining} von ${capacity} Plätzen frei`,
      bookable: true,
      waitlist: false,
    };
  }
  return { ...base, state: "available", label: "Plätze verfügbar", bookable: true, waitlist: false };
}

/** Compact variant for the hero signal: "Nächster Abend · 14 Plätze verfügbar". */
export function heroAvailabilityLine(a: Availability): string | null {
  switch (a.state) {
    case "sold_out":
      return "Ausverkauft";
    case "few":
    case "low":
      return `${a.remaining} ${a.remaining === 1 ? "Platz" : "Plätze"} verfügbar`;
    case "available":
      return "Plätze verfügbar";
    default:
      return null;
  }
}

/** schema.org ItemAvailability for Event JSON-LD. */
export function schemaAvailability(a: Availability): string {
  if (a.state === "sold_out") return "https://schema.org/SoldOut";
  if (a.state === "coming_soon") return "https://schema.org/PreOrder";
  if (a.state === "available" || a.state === "low" || a.state === "few") return "https://schema.org/InStock";
  return "https://schema.org/Discontinued";
}
