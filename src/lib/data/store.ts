import type {
  AttendeeRow,
  CreateOrderInput,
  DashboardStats,
  EventInput,
  EventRecord,
  EventWithAvailability,
  OrderRecord,
  PrivateInquiry,
  SiteSettings,
  Testimonial,
  TicketHold,
  TicketRecord,
  WaitlistEntry,
} from "./types";

/**
 * The single data contract. Public UI, checkout, webhooks and admin all go
 * through this interface, so the Supabase and in-memory implementations stay
 * interchangeable and inventory rules live in one place per backend.
 */
export interface DataStore {
  readonly kind: "memory" | "supabase";

  // Events
  listPublishedUpcomingEvents(limit?: number): Promise<EventWithAvailability[]>;
  getPublishedEventBySlug(slug: string): Promise<EventWithAvailability | null>;
  listAllEvents(): Promise<EventWithAvailability[]>;
  getEventById(id: string): Promise<EventWithAvailability | null>;
  createEvent(input: EventInput): Promise<EventRecord>;
  updateEvent(id: string, input: Partial<EventInput>): Promise<EventRecord>;
  duplicateEvent(id: string): Promise<EventRecord>;

  // Orders & inventory
  /** Atomically creates a pending order plus an active hold, or throws InsufficientCapacityError. */
  createOrderWithHold(input: CreateOrderInput, holdMinutes: number): Promise<{ order: OrderRecord; hold: TicketHold }>;
  attachStripeSession(orderId: string, sessionId: string): Promise<void>;
  getOrderById(id: string): Promise<OrderRecord | null>;
  getOrderByStripeSession(sessionId: string): Promise<OrderRecord | null>;
  /**
   * Converts the hold into tickets. Idempotent. If the hold expired and seats
   * are no longer available, the order becomes `requires_review`.
   */
  confirmOrderPaid(orderId: string, paymentIntentId: string | null): Promise<{ order: OrderRecord; tickets: TicketRecord[] }>;
  cancelOrder(orderId: string, reason: "cancelled" | "expired"): Promise<OrderRecord | null>;
  markOrderRefunded(orderId: string): Promise<OrderRecord | null>;
  listTicketsForOrder(orderId: string): Promise<TicketRecord[]>;
  /** Paid orders for an event (guest communication). */
  listPaidOrdersForEvent(eventId: string): Promise<OrderRecord[]>;
  /** Paid orders of published events starting inside [from, to] that have not been reminded. */
  listOrdersNeedingReminder(from: string, to: string): Promise<{ order: OrderRecord; event: EventRecord }[]>;
  markReminderSent(orderIds: string[]): Promise<void>;
  expireStaleHolds(): Promise<number>;

  // Webhook idempotency
  recordWebhookEvent(id: string, type: string): Promise<boolean>; // false → already processed
  /** Removes the idempotency record so Stripe's retry can reprocess after a failure. */
  releaseWebhookEvent(id: string): Promise<void>;
  getOrderByPaymentIntent(paymentIntentId: string): Promise<OrderRecord | null>;

  // Waitlist
  joinWaitlist(entry: { eventId: string; name: string; email: string; quantity: number }): Promise<{ entry: WaitlistEntry; created: boolean }>;
  listWaitlist(eventId?: string): Promise<WaitlistEntry[]>;
  markWaitlistNotified(ids: string[]): Promise<void>;

  // Private inquiries
  createInquiry(input: Omit<PrivateInquiry, "id" | "status" | "createdAt">): Promise<PrivateInquiry>;
  listInquiries(): Promise<PrivateInquiry[]>;
  updateInquiryStatus(id: string, status: PrivateInquiry["status"]): Promise<void>;

  // Admin
  listAttendees(filter: { eventId?: string; query?: string }): Promise<AttendeeRow[]>;
  setTicketCheckedIn(ticketId: string, checkedIn: boolean): Promise<TicketRecord | null>;
  getDashboardStats(): Promise<DashboardStats>;

  // Settings & social proof
  getSettings(): Promise<SiteSettings>;
  setSetting(key: string, value: unknown): Promise<void>;
  listPublishedTestimonials(): Promise<Testimonial[]>;
}
