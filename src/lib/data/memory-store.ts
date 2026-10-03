import { randomUUID } from "node:crypto";
import type { DataStore } from "./store";
import {
  InsufficientCapacityError,
  type AttendeeRow,
  type CreateOrderInput,
  type DashboardStats,
  type EventInput,
  type EventMedia,
  type EventRecord,
  type EventWithAvailability,
  type OrderRecord,
  type PrivateInquiry,
  type SiteSettings,
  type Testimonial,
  type TicketHold,
  type TicketRecord,
  type WaitlistEntry,
} from "./types";
import { seedEvents, seedSold } from "./seed";
import { generateOrderNumber, generateTicketCode } from "@/lib/tickets/codes";

const now = () => new Date().toISOString();

/**
 * Development store. Same semantics as the SQL functions, single-threaded by
 * nature of the Node event loop, so "atomic" holds are trivially correct here.
 */
export class MemoryStore implements DataStore {
  readonly kind = "memory" as const;

  private events = new Map<string, EventRecord>();
  private media = new Map<string, EventMedia[]>();
  private orders = new Map<string, OrderRecord>();
  private holds = new Map<string, TicketHold>();
  private tickets = new Map<string, TicketRecord>();
  private waitlist = new Map<string, WaitlistEntry>();
  private inquiries = new Map<string, PrivateInquiry>();
  private webhookEvents = new Set<string>();
  private settings: SiteSettings = {};
  private testimonials: Testimonial[] = [];

  constructor() {
    for (const input of seedEvents) {
      const ev = this.insertEvent(input);
      const sold = seedSold[input.slug] ?? 0;
      if (sold > 0) this.seedPaidOrder(ev, sold);
    }
  }

  // ── helpers ────────────────────────────────────────────────────────────
  private insertEvent(input: EventInput): EventRecord {
    const ts = now();
    const ev: EventRecord = { id: randomUUID(), currency: "EUR", createdAt: ts, updatedAt: ts, ...input };
    this.events.set(ev.id, ev);
    this.media.set(ev.id, []);
    return ev;
  }

  private seedPaidOrder(ev: EventRecord, qty: number) {
    const ts = now();
    const order: OrderRecord = {
      id: randomUUID(),
      orderNumber: generateOrderNumber(),
      eventId: ev.id,
      status: "paid",
      firstName: "Demo",
      lastName: "Gast",
      email: "demo@example.com",
      phone: null,
      quantity: qty,
      unitPriceCents: ev.priceCents,
      totalCents: ev.priceCents * qty,
      currency: ev.currency,
      stripeCheckoutSessionId: null,
      stripePaymentIntentId: null,
      marketingConsent: false,
      termsAcceptedAt: ts,
      locale: "de-DE",
      paidAt: ts,
      reminderSentAt: null,
      createdAt: ts,
      updatedAt: ts,
    };
    this.orders.set(order.id, order);
    for (let i = 0; i < qty; i++) {
      const t: TicketRecord = { id: randomUUID(), orderId: order.id, eventId: ev.id, code: generateTicketCode(), status: "valid", checkedInAt: null, createdAt: ts };
      this.tickets.set(t.id, t);
    }
  }

  private expireHoldsNow() {
    const t = Date.now();
    for (const h of this.holds.values()) {
      if (h.status === "active" && new Date(h.expiresAt).getTime() < t) {
        h.status = "expired";
        const o = this.orders.get(h.orderId);
        if (o && o.status === "pending") {
          o.status = "expired";
          o.updatedAt = now();
        }
      }
    }
  }

  private inventory(eventId: string) {
    this.expireHoldsNow();
    let sold = 0;
    for (const t of this.tickets.values()) if (t.eventId === eventId && (t.status === "valid" || t.status === "checked_in")) sold++;
    let held = 0;
    for (const h of this.holds.values()) if (h.eventId === eventId && h.status === "active") held += h.quantity;
    return { sold, held };
  }

  private withAvailability(ev: EventRecord): EventWithAvailability {
    const { sold, held } = this.inventory(ev.id);
    return { ...ev, sold, held, remaining: Math.max(0, ev.capacity - sold - held), media: this.media.get(ev.id) ?? [] };
  }

  // ── events ─────────────────────────────────────────────────────────────
  async listPublishedUpcomingEvents(limit = 6) {
    const t = Date.now();
    return [...this.events.values()]
      .filter((e) => e.status === "published" && new Date(e.endsAt).getTime() > t)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      .slice(0, limit)
      .map((e) => this.withAvailability(e));
  }
  async getPublishedEventBySlug(slug: string) {
    const ev = [...this.events.values()].find((e) => e.slug === slug && e.status === "published");
    return ev ? this.withAvailability(ev) : null;
  }
  async listAllEvents() {
    return [...this.events.values()].sort((a, b) => b.startsAt.localeCompare(a.startsAt)).map((e) => this.withAvailability(e));
  }
  async getEventById(id: string) {
    const ev = this.events.get(id);
    return ev ? this.withAvailability(ev) : null;
  }
  async createEvent(input: EventInput) {
    if ([...this.events.values()].some((e) => e.slug === input.slug)) throw new Error("slug_taken");
    return this.insertEvent(input);
  }
  async updateEvent(id: string, input: Partial<EventInput>) {
    const ev = this.events.get(id);
    if (!ev) throw new Error("not_found");
    if (input.slug && [...this.events.values()].some((e) => e.slug === input.slug && e.id !== id)) throw new Error("slug_taken");
    Object.assign(ev, input, { updatedAt: now() });
    return ev;
  }
  async duplicateEvent(id: string) {
    const ev = this.events.get(id);
    if (!ev) throw new Error("not_found");
    const { id: _id, createdAt: _c, updatedAt: _u, currency: _cur, ...rest } = ev;
    void _id; void _c; void _u; void _cur;
    return this.insertEvent({ ...rest, slug: `${ev.slug}-kopie-${Date.now().toString(36)}`, status: "draft" });
  }

  // ── orders ─────────────────────────────────────────────────────────────
  async createOrderWithHold(input: CreateOrderInput, holdMinutes: number) {
    const ev = this.events.get(input.eventId);
    if (!ev) throw new Error("not_found");
    const { sold, held } = this.inventory(ev.id);
    const remaining = ev.capacity - sold - held;
    if (input.quantity > remaining) throw new InsufficientCapacityError(Math.max(0, remaining));
    const ts = now();
    const order: OrderRecord = {
      id: randomUUID(),
      orderNumber: generateOrderNumber(),
      eventId: ev.id,
      status: "pending",
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      quantity: input.quantity,
      unitPriceCents: input.unitPriceCents,
      totalCents: input.unitPriceCents * input.quantity,
      currency: input.currency,
      stripeCheckoutSessionId: null,
      stripePaymentIntentId: null,
      marketingConsent: input.marketingConsent,
      termsAcceptedAt: ts,
      locale: input.locale,
      paidAt: null,
      reminderSentAt: null,
      createdAt: ts,
      updatedAt: ts,
    };
    const hold: TicketHold = {
      id: randomUUID(),
      eventId: ev.id,
      orderId: order.id,
      quantity: input.quantity,
      expiresAt: new Date(Date.now() + holdMinutes * 60_000).toISOString(),
      status: "active",
      createdAt: ts,
    };
    this.orders.set(order.id, order);
    this.holds.set(hold.id, hold);
    return { order, hold };
  }
  async attachStripeSession(orderId: string, sessionId: string) {
    const o = this.orders.get(orderId);
    if (o) { o.stripeCheckoutSessionId = sessionId; o.updatedAt = now(); }
  }
  async getOrderById(id: string) { return this.orders.get(id) ?? null; }
  async getOrderByStripeSession(sessionId: string) {
    return [...this.orders.values()].find((o) => o.stripeCheckoutSessionId === sessionId) ?? null;
  }
  async confirmOrderPaid(orderId: string, paymentIntentId: string | null) {
    const o = this.orders.get(orderId);
    if (!o) throw new Error("not_found");
    if (o.status === "paid") return { order: o, tickets: await this.listTicketsForOrder(orderId) };
    const hold = [...this.holds.values()].find((h) => h.orderId === orderId);
    const ev = this.events.get(o.eventId)!;
    const { sold, held } = this.inventory(ev.id);
    const holdStillActive = hold?.status === "active";
    const remainingExcludingHold = ev.capacity - sold - held + (holdStillActive ? hold.quantity : 0);
    if (remainingExcludingHold < o.quantity) {
      o.status = "requires_review";
      o.stripePaymentIntentId = paymentIntentId;
      o.updatedAt = now();
      return { order: o, tickets: [] };
    }
    if (hold) hold.status = "converted";
    const ts = now();
    const tickets: TicketRecord[] = [];
    for (let i = 0; i < o.quantity; i++) {
      const t: TicketRecord = { id: randomUUID(), orderId: o.id, eventId: ev.id, code: generateTicketCode(), status: "valid", checkedInAt: null, createdAt: ts };
      this.tickets.set(t.id, t);
      tickets.push(t);
    }
    o.status = "paid";
    o.paidAt = ts;
    o.stripePaymentIntentId = paymentIntentId;
    o.updatedAt = ts;
    return { order: o, tickets };
  }
  async cancelOrder(orderId: string, reason: "cancelled" | "expired") {
    const o = this.orders.get(orderId);
    if (!o) return null;
    if (o.status !== "pending") return o;
    o.status = reason;
    o.updatedAt = now();
    for (const h of this.holds.values()) if (h.orderId === orderId && h.status === "active") h.status = "released";
    return o;
  }
  async markOrderRefunded(orderId: string) {
    const o = this.orders.get(orderId);
    if (!o) return null;
    o.status = "refunded";
    o.updatedAt = now();
    for (const t of this.tickets.values()) if (t.orderId === orderId) t.status = "refunded";
    return o;
  }
  async listTicketsForOrder(orderId: string) {
    return [...this.tickets.values()].filter((t) => t.orderId === orderId);
  }
  async listPaidOrdersForEvent(eventId: string) {
    return [...this.orders.values()].filter((o) => o.eventId === eventId && o.status === "paid");
  }
  async listOrdersNeedingReminder(from: string, to: string) {
    const out: { order: OrderRecord; event: EventRecord }[] = [];
    for (const o of this.orders.values()) {
      if (o.status !== "paid" || o.reminderSentAt) continue;
      const ev = this.events.get(o.eventId);
      if (!ev || ev.status !== "published") continue;
      if (ev.startsAt >= from && ev.startsAt <= to) out.push({ order: o, event: ev });
    }
    return out;
  }
  async markReminderSent(ids: string[]) {
    for (const id of ids) { const o = this.orders.get(id); if (o) o.reminderSentAt = now(); }
  }
  async expireStaleHolds() {
    const before = [...this.holds.values()].filter((h) => h.status === "active").length;
    this.expireHoldsNow();
    const after = [...this.holds.values()].filter((h) => h.status === "active").length;
    return before - after;
  }

  async recordWebhookEvent(id: string) {
    if (this.webhookEvents.has(id)) return false;
    this.webhookEvents.add(id);
    return true;
  }
  async releaseWebhookEvent(id: string) { this.webhookEvents.delete(id); }
  async getOrderByPaymentIntent(pi: string) {
    return [...this.orders.values()].find((o) => o.stripePaymentIntentId === pi) ?? null;
  }

  // ── waitlist ───────────────────────────────────────────────────────────
  async joinWaitlist(entry: { eventId: string; name: string; email: string; quantity: number }) {
    const email = entry.email.toLowerCase();
    const existing = [...this.waitlist.values()].find((w) => w.eventId === entry.eventId && w.email === email && w.status !== "removed");
    if (existing) return { entry: existing, created: false };
    const w: WaitlistEntry = { id: randomUUID(), eventId: entry.eventId, name: entry.name, email, quantity: entry.quantity, status: "waiting", notifiedAt: null, createdAt: now() };
    this.waitlist.set(w.id, w);
    return { entry: w, created: true };
  }
  async listWaitlist(eventId?: string) {
    return [...this.waitlist.values()].filter((w) => !eventId || w.eventId === eventId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  async markWaitlistNotified(ids: string[]) {
    for (const id of ids) { const w = this.waitlist.get(id); if (w) { w.status = "notified"; w.notifiedAt = now(); } }
  }

  // ── inquiries ──────────────────────────────────────────────────────────
  async createInquiry(input: Omit<PrivateInquiry, "id" | "status" | "createdAt">) {
    const q: PrivateInquiry = { id: randomUUID(), status: "new", createdAt: now(), ...input };
    this.inquiries.set(q.id, q);
    return q;
  }
  async listInquiries() { return [...this.inquiries.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  async updateInquiryStatus(id: string, status: PrivateInquiry["status"]) { const q = this.inquiries.get(id); if (q) q.status = status; }

  // ── admin ──────────────────────────────────────────────────────────────
  async listAttendees(filter: { eventId?: string; query?: string }): Promise<AttendeeRow[]> {
    const q = filter.query?.trim().toLowerCase();
    return [...this.orders.values()]
      .filter((o) => o.status !== "pending" && o.status !== "expired")
      .filter((o) => !filter.eventId || o.eventId === filter.eventId)
      .filter((o) => !q || `${o.firstName} ${o.lastName} ${o.email} ${o.orderNumber}`.toLowerCase().includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((o) => {
        const ev = this.events.get(o.eventId)!;
        return { order: o, event: { id: ev.id, slug: ev.slug, title: ev.title, startsAt: ev.startsAt }, tickets: [...this.tickets.values()].filter((t) => t.orderId === o.id) };
      });
  }
  async setTicketCheckedIn(ticketId: string, checkedIn: boolean) {
    const t = this.tickets.get(ticketId);
    if (!t) return null;
    t.status = checkedIn ? "checked_in" : "valid";
    t.checkedInAt = checkedIn ? now() : null;
    return t;
  }
  async getDashboardStats(): Promise<DashboardStats> {
    const upcoming = await this.listPublishedUpcomingEvents(1);
    const next = upcoming[0] ?? null;
    const paid = [...this.orders.values()].filter((o) => o.status === "paid");
    return {
      nextEvent: next,
      ticketsSold: next ? next.sold : 0,
      remainingSeats: next ? next.remaining : 0,
      activeHolds: [...this.holds.values()].filter((h) => h.status === "active").reduce((n, h) => n + h.quantity, 0),
      revenueCents: paid.reduce((n, o) => n + o.totalCents, 0),
      waitlistCount: [...this.waitlist.values()].filter((w) => w.status === "waiting").length,
      newInquiries: [...this.inquiries.values()].filter((i) => i.status === "new").length,
      ordersRequiringReview: [...this.orders.values()].filter((o) => o.status === "requires_review").length,
    };
  }

  async getSettings() { return this.settings; }
  async setSetting(key: string, value: unknown) { this.settings[key] = value; }
  async listPublishedTestimonials() { return this.testimonials.filter((t) => t.published); }
}
