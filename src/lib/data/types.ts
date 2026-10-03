/** Shared domain types. Mirrors supabase/migrations/0001_init.sql. */

export type EventStatus = "draft" | "published" | "cancelled" | "archived";
export type OrderStatus =
  | "pending"
  | "paid"
  | "cancelled"
  | "expired"
  | "refunded"
  | "requires_review";
export type HoldStatus = "active" | "converted" | "released" | "expired";
export type TicketStatus = "valid" | "checked_in" | "cancelled" | "refunded";
export type WaitlistStatus = "waiting" | "notified" | "converted" | "removed";
export type InquiryStatus = "new" | "contacted" | "closed";

export interface EventRecord {
  id: string;
  slug: string;
  title: string;
  /** e.g. "Edition No. 03" — short, printed on the placard */
  edition: string | null;
  subtitle: string | null;
  description: string;
  startsAt: string; // ISO
  endsAt: string;
  doorsAt: string;
  capacity: number;
  priceCents: number;
  currency: string;
  vatRate: number;
  minimumAge: number | null;
  status: EventStatus;
  salesOpenAt: string | null;
  salesCloseAt: string | null;
  heroImagePath: string;
  heroImageAlt: string;
  maxTicketsPerOrder: number;
  lowThreshold: number;
  fewThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventMedia {
  id: string;
  eventId: string;
  path: string;
  alt: string;
  sortOrder: number;
}

/** Event + live inventory, the only shape the public UI consumes. */
export interface EventWithAvailability extends EventRecord {
  sold: number;
  held: number;
  remaining: number;
  media: EventMedia[];
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  eventId: string;
  status: OrderStatus;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  currency: string;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  marketingConsent: boolean;
  termsAcceptedAt: string;
  locale: string;
  paidAt: string | null;
  reminderSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketHold {
  id: string;
  eventId: string;
  orderId: string;
  quantity: number;
  expiresAt: string;
  status: HoldStatus;
  createdAt: string;
}

export interface TicketRecord {
  id: string;
  orderId: string;
  eventId: string;
  code: string;
  status: TicketStatus;
  checkedInAt: string | null;
  createdAt: string;
}

export interface WaitlistEntry {
  id: string;
  eventId: string;
  name: string;
  email: string;
  quantity: number;
  status: WaitlistStatus;
  notifiedAt: string | null;
  createdAt: string;
}

export interface PrivateInquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  eventType: string;
  guests: number;
  preferredDate: string | null;
  alternativeDate: string | null;
  message: string;
  status: InquiryStatus;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  author: string;
  text: string;
  eventId: string | null;
  published: boolean;
  createdAt: string;
}

export type SiteSettings = Record<string, unknown>;

export interface EventInput {
  slug: string;
  title: string;
  edition: string | null;
  subtitle: string | null;
  description: string;
  startsAt: string;
  endsAt: string;
  doorsAt: string;
  capacity: number;
  priceCents: number;
  vatRate: number;
  minimumAge: number | null;
  status: EventStatus;
  salesOpenAt: string | null;
  salesCloseAt: string | null;
  heroImagePath: string;
  heroImageAlt: string;
  maxTicketsPerOrder: number;
  lowThreshold: number;
  fewThreshold: number;
}

export interface CreateOrderInput {
  eventId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  quantity: number;
  unitPriceCents: number;
  currency: string;
  marketingConsent: boolean;
  locale: string;
}

export interface AttendeeRow {
  order: OrderRecord;
  event: Pick<EventRecord, "id" | "slug" | "title" | "startsAt">;
  tickets: TicketRecord[];
}

export interface DashboardStats {
  nextEvent: EventWithAvailability | null;
  ticketsSold: number;
  remainingSeats: number;
  activeHolds: number;
  revenueCents: number;
  waitlistCount: number;
  newInquiries: number;
  ordersRequiringReview: number;
}

export class InsufficientCapacityError extends Error {
  constructor(public readonly remaining: number) {
    super("insufficient_capacity");
    this.name = "InsufficientCapacityError";
  }
}
