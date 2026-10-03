import { createClient, type SupabaseClient } from "@supabase/supabase-js";
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
import { generateOrderNumber } from "@/lib/tickets/codes";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const mapEvent = (r: Row): EventRecord => ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  edition: r.edition,
  subtitle: r.subtitle,
  description: r.description,
  startsAt: r.starts_at,
  endsAt: r.ends_at,
  doorsAt: r.doors_at,
  capacity: r.capacity,
  priceCents: r.price_cents,
  currency: r.currency,
  vatRate: Number(r.vat_rate),
  minimumAge: r.minimum_age,
  status: r.status,
  salesOpenAt: r.sales_open_at,
  salesCloseAt: r.sales_close_at,
  heroImagePath: r.hero_image_path,
  heroImageAlt: r.hero_image_alt,
  maxTicketsPerOrder: r.max_tickets_per_order,
  lowThreshold: r.low_threshold,
  fewThreshold: r.few_threshold,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapMedia = (r: Row): EventMedia => ({ id: r.id, eventId: r.event_id, path: r.path, alt: r.alt, sortOrder: r.sort_order });

const mapOrder = (r: Row): OrderRecord => ({
  id: r.id,
  orderNumber: r.order_number,
  eventId: r.event_id,
  status: r.status,
  firstName: r.first_name,
  lastName: r.last_name,
  email: r.email,
  phone: r.phone,
  quantity: r.quantity,
  unitPriceCents: r.unit_price_cents,
  totalCents: r.total_cents,
  currency: r.currency,
  stripeCheckoutSessionId: r.stripe_checkout_session_id,
  stripePaymentIntentId: r.stripe_payment_intent_id,
  marketingConsent: r.marketing_consent,
  termsAcceptedAt: r.terms_accepted_at,
  locale: r.locale,
  paidAt: r.paid_at,
  reminderSentAt: r.reminder_sent_at ?? null,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapTicket = (r: Row): TicketRecord => ({ id: r.id, orderId: r.order_id, eventId: r.event_id, code: r.code, status: r.status, checkedInAt: r.checked_in_at, createdAt: r.created_at });
const mapWaitlist = (r: Row): WaitlistEntry => ({ id: r.id, eventId: r.event_id, name: r.name, email: r.email, quantity: r.quantity, status: r.status, notifiedAt: r.notified_at, createdAt: r.created_at });
const mapInquiry = (r: Row): PrivateInquiry => ({ id: r.id, name: r.name, email: r.email, phone: r.phone, eventType: r.event_type, guests: r.guests, preferredDate: r.preferred_date, alternativeDate: r.alternative_date, message: r.message, status: r.status, createdAt: r.created_at });

const eventToRow = (i: Partial<EventInput>): Row => {
  const r: Row = {};
  if (i.slug !== undefined) r.slug = i.slug;
  if (i.title !== undefined) r.title = i.title;
  if (i.edition !== undefined) r.edition = i.edition;
  if (i.subtitle !== undefined) r.subtitle = i.subtitle;
  if (i.description !== undefined) r.description = i.description;
  if (i.startsAt !== undefined) r.starts_at = i.startsAt;
  if (i.endsAt !== undefined) r.ends_at = i.endsAt;
  if (i.doorsAt !== undefined) r.doors_at = i.doorsAt;
  if (i.capacity !== undefined) r.capacity = i.capacity;
  if (i.priceCents !== undefined) r.price_cents = i.priceCents;
  if (i.vatRate !== undefined) r.vat_rate = i.vatRate;
  if (i.minimumAge !== undefined) r.minimum_age = i.minimumAge;
  if (i.status !== undefined) r.status = i.status;
  if (i.salesOpenAt !== undefined) r.sales_open_at = i.salesOpenAt;
  if (i.salesCloseAt !== undefined) r.sales_close_at = i.salesCloseAt;
  if (i.heroImagePath !== undefined) r.hero_image_path = i.heroImagePath;
  if (i.heroImageAlt !== undefined) r.hero_image_alt = i.heroImageAlt;
  if (i.maxTicketsPerOrder !== undefined) r.max_tickets_per_order = i.maxTicketsPerOrder;
  if (i.lowThreshold !== undefined) r.low_threshold = i.lowThreshold;
  if (i.fewThreshold !== undefined) r.few_threshold = i.fewThreshold;
  return r;
};

function fail(error: { message: string } | null, ctx: string): never {
  throw new Error(`[supabase:${ctx}] ${error?.message ?? "unknown error"}`);
}

export class SupabaseStore implements DataStore {
  readonly kind = "supabase" as const;
  private db: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.db = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  private async hydrate(rows: Row[]): Promise<EventWithAvailability[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const [{ data: inv, error: e1 }, { data: media, error: e2 }] = await Promise.all([
      this.db.from("event_inventory").select("*").in("event_id", ids),
      this.db.from("event_media").select("*").in("event_id", ids).order("sort_order"),
    ]);
    if (e1) fail(e1, "inventory");
    if (e2) fail(e2, "media");
    const invMap = new Map((inv ?? []).map((r: Row) => [r.event_id, r]));
    return rows.map((r) => {
      const ev = mapEvent(r);
      const i = invMap.get(r.id) ?? { sold: 0, held: 0 };
      return { ...ev, sold: i.sold, held: i.held, remaining: Math.max(0, ev.capacity - i.sold - i.held), media: (media ?? []).filter((m: Row) => m.event_id === r.id).map(mapMedia) };
    });
  }

  async listPublishedUpcomingEvents(limit = 6) {
    const { data, error } = await this.db.from("events").select("*").eq("status", "published").gt("ends_at", new Date().toISOString()).order("starts_at").limit(limit);
    if (error) fail(error, "listPublishedUpcomingEvents");
    return this.hydrate(data ?? []);
  }
  async getPublishedEventBySlug(slug: string) {
    const { data, error } = await this.db.from("events").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
    if (error) fail(error, "getPublishedEventBySlug");
    return data ? (await this.hydrate([data]))[0] : null;
  }
  async listAllEvents() {
    const { data, error } = await this.db.from("events").select("*").order("starts_at", { ascending: false });
    if (error) fail(error, "listAllEvents");
    return this.hydrate(data ?? []);
  }
  async getEventById(id: string) {
    const { data, error } = await this.db.from("events").select("*").eq("id", id).maybeSingle();
    if (error) fail(error, "getEventById");
    return data ? (await this.hydrate([data]))[0] : null;
  }
  async createEvent(input: EventInput) {
    const { data, error } = await this.db.from("events").insert(eventToRow(input)).select("*").single();
    if (error) { if (error.code === "23505") throw new Error("slug_taken"); fail(error, "createEvent"); }
    return mapEvent(data);
  }
  async updateEvent(id: string, input: Partial<EventInput>) {
    const { data, error } = await this.db.from("events").update(eventToRow(input)).eq("id", id).select("*").single();
    if (error) { if (error.code === "23505") throw new Error("slug_taken"); fail(error, "updateEvent"); }
    return mapEvent(data);
  }
  async duplicateEvent(id: string) {
    const src = await this.getEventById(id);
    if (!src) throw new Error("not_found");
    const { id: _i, createdAt: _c, updatedAt: _u, currency: _cur, sold: _s, held: _h, remaining: _r, media: _m, ...rest } = src;
    void _i; void _c; void _u; void _cur; void _s; void _h; void _r; void _m;
    return this.createEvent({ ...rest, slug: `${src.slug}-kopie-${Date.now().toString(36)}`, status: "draft" });
  }

  async createOrderWithHold(input: CreateOrderInput, holdMinutes: number) {
    const { data, error } = await this.db.rpc("create_order_with_hold", {
      p_event_id: input.eventId,
      p_first_name: input.firstName,
      p_last_name: input.lastName,
      p_email: input.email,
      p_phone: input.phone,
      p_quantity: input.quantity,
      p_unit_price_cents: input.unitPriceCents,
      p_currency: input.currency,
      p_marketing_consent: input.marketingConsent,
      p_locale: input.locale,
      p_order_number: generateOrderNumber(),
      p_hold_minutes: holdMinutes,
    });
    if (error) {
      if (error.message.includes("insufficient_capacity")) {
        const remaining = Number((error as Row).details ?? 0);
        throw new InsufficientCapacityError(Number.isFinite(remaining) ? remaining : 0);
      }
      fail(error, "createOrderWithHold");
    }
    const row = (Array.isArray(data) ? data[0] : data) as Row;
    const order = await this.getOrderById(row.order_id);
    if (!order) throw new Error("order_missing_after_insert");
    const hold: TicketHold = { id: row.hold_id, eventId: input.eventId, orderId: order.id, quantity: input.quantity, expiresAt: row.expires_at, status: "active", createdAt: order.createdAt };
    return { order, hold };
  }
  async attachStripeSession(orderId: string, sessionId: string) {
    const { error } = await this.db.from("orders").update({ stripe_checkout_session_id: sessionId }).eq("id", orderId);
    if (error) fail(error, "attachStripeSession");
  }
  async getOrderById(id: string) {
    const { data, error } = await this.db.from("orders").select("*").eq("id", id).maybeSingle();
    if (error) fail(error, "getOrderById");
    return data ? mapOrder(data) : null;
  }
  async getOrderByStripeSession(sessionId: string) {
    const { data, error } = await this.db.from("orders").select("*").eq("stripe_checkout_session_id", sessionId).maybeSingle();
    if (error) fail(error, "getOrderByStripeSession");
    return data ? mapOrder(data) : null;
  }
  async confirmOrderPaid(orderId: string, paymentIntentId: string | null) {
    const { error } = await this.db.rpc("confirm_order_paid", { p_order_id: orderId, p_payment_intent_id: paymentIntentId });
    if (error) fail(error, "confirmOrderPaid");
    const order = await this.getOrderById(orderId);
    if (!order) throw new Error("order_not_found");
    return { order, tickets: await this.listTicketsForOrder(orderId) };
  }
  async cancelOrder(orderId: string, reason: "cancelled" | "expired") {
    const { error } = await this.db.rpc("cancel_pending_order", { p_order_id: orderId, p_reason: reason });
    if (error) fail(error, "cancelOrder");
    return this.getOrderById(orderId);
  }
  async markOrderRefunded(orderId: string) {
    const { error } = await this.db.from("orders").update({ status: "refunded" }).eq("id", orderId);
    if (error) fail(error, "markOrderRefunded");
    await this.db.from("tickets").update({ status: "refunded" }).eq("order_id", orderId);
    return this.getOrderById(orderId);
  }
  async listTicketsForOrder(orderId: string) {
    const { data, error } = await this.db.from("tickets").select("*").eq("order_id", orderId).order("created_at");
    if (error) fail(error, "listTicketsForOrder");
    return (data ?? []).map(mapTicket);
  }
  async listPaidOrdersForEvent(eventId: string) {
    const { data, error } = await this.db.from("orders").select("*").eq("event_id", eventId).eq("status", "paid");
    if (error) fail(error, "listPaidOrdersForEvent");
    return (data ?? []).map(mapOrder);
  }
  async listOrdersNeedingReminder(from: string, to: string) {
    const { data, error } = await this.db
      .from("orders")
      .select("*, events!inner(*)")
      .eq("status", "paid")
      .is("reminder_sent_at", null)
      .eq("events.status", "published")
      .gte("events.starts_at", from)
      .lte("events.starts_at", to);
    if (error) fail(error, "listOrdersNeedingReminder");
    return (data ?? []).map((r: Row) => ({ order: mapOrder(r), event: mapEvent(r.events) }));
  }
  async markReminderSent(ids: string[]) {
    if (ids.length === 0) return;
    const { error } = await this.db.from("orders").update({ reminder_sent_at: new Date().toISOString() }).in("id", ids);
    if (error) fail(error, "markReminderSent");
  }
  async expireStaleHolds() {
    const { data, error } = await this.db.rpc("expire_stale_holds");
    if (error) fail(error, "expireStaleHolds");
    return Number(data ?? 0);
  }
  async recordWebhookEvent(id: string, type: string) {
    const { error } = await this.db.from("stripe_webhook_events").insert({ id, type });
    if (error) { if (error.code === "23505") return false; fail(error, "recordWebhookEvent"); }
    return true;
  }
  async releaseWebhookEvent(id: string) {
    await this.db.from("stripe_webhook_events").delete().eq("id", id);
  }
  async getOrderByPaymentIntent(pi: string) {
    const { data, error } = await this.db.from("orders").select("*").eq("stripe_payment_intent_id", pi).maybeSingle();
    if (error) fail(error, "getOrderByPaymentIntent");
    return data ? mapOrder(data) : null;
  }

  async joinWaitlist(entry: { eventId: string; name: string; email: string; quantity: number }) {
    const email = entry.email.toLowerCase();
    const { data: existing } = await this.db.from("waitlist_entries").select("*").eq("event_id", entry.eventId).ilike("email", email).neq("status", "removed").maybeSingle();
    if (existing) return { entry: mapWaitlist(existing), created: false };
    const { data, error } = await this.db.from("waitlist_entries").insert({ event_id: entry.eventId, name: entry.name, email, quantity: entry.quantity }).select("*").single();
    if (error) fail(error, "joinWaitlist");
    return { entry: mapWaitlist(data), created: true };
  }
  async listWaitlist(eventId?: string) {
    let q = this.db.from("waitlist_entries").select("*").order("created_at");
    if (eventId) q = q.eq("event_id", eventId);
    const { data, error } = await q;
    if (error) fail(error, "listWaitlist");
    return (data ?? []).map(mapWaitlist);
  }
  async markWaitlistNotified(ids: string[]) {
    if (ids.length === 0) return;
    const { error } = await this.db.from("waitlist_entries").update({ status: "notified", notified_at: new Date().toISOString() }).in("id", ids);
    if (error) fail(error, "markWaitlistNotified");
  }

  async createInquiry(input: Omit<PrivateInquiry, "id" | "status" | "createdAt">) {
    const { data, error } = await this.db.from("private_event_inquiries").insert({
      name: input.name, email: input.email, phone: input.phone, event_type: input.eventType, guests: input.guests,
      preferred_date: input.preferredDate, alternative_date: input.alternativeDate, message: input.message,
    }).select("*").single();
    if (error) fail(error, "createInquiry");
    return mapInquiry(data);
  }
  async listInquiries() {
    const { data, error } = await this.db.from("private_event_inquiries").select("*").order("created_at", { ascending: false });
    if (error) fail(error, "listInquiries");
    return (data ?? []).map(mapInquiry);
  }
  async updateInquiryStatus(id: string, status: PrivateInquiry["status"]) {
    const { error } = await this.db.from("private_event_inquiries").update({ status }).eq("id", id);
    if (error) fail(error, "updateInquiryStatus");
  }

  async listAttendees(filter: { eventId?: string; query?: string }): Promise<AttendeeRow[]> {
    let q = this.db.from("orders").select("*, events!inner(id, slug, title, starts_at), tickets(*)").not("status", "in", "(pending,expired)").order("created_at", { ascending: false }).limit(500);
    if (filter.eventId) q = q.eq("event_id", filter.eventId);
    if (filter.query) {
      const term = `%${filter.query.trim()}%`;
      q = q.or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},order_number.ilike.${term}`);
    }
    const { data, error } = await q;
    if (error) fail(error, "listAttendees");
    return (data ?? []).map((r: Row) => ({
      order: mapOrder(r),
      event: { id: r.events.id, slug: r.events.slug, title: r.events.title, startsAt: r.events.starts_at },
      tickets: (r.tickets ?? []).map(mapTicket),
    }));
  }
  async setTicketCheckedIn(ticketId: string, checkedIn: boolean) {
    const { data, error } = await this.db.from("tickets").update({ status: checkedIn ? "checked_in" : "valid", checked_in_at: checkedIn ? new Date().toISOString() : null }).eq("id", ticketId).select("*").maybeSingle();
    if (error) fail(error, "setTicketCheckedIn");
    return data ? mapTicket(data) : null;
  }
  async getDashboardStats(): Promise<DashboardStats> {
    const [next] = await this.listPublishedUpcomingEvents(1);
    const [{ data: paid }, { count: holds }, { count: waiting }, { count: inquiries }, { count: review }] = await Promise.all([
      this.db.from("orders").select("total_cents").eq("status", "paid"),
      this.db.from("ticket_holds").select("quantity", { count: "exact", head: true }).eq("status", "active").gt("expires_at", new Date().toISOString()),
      this.db.from("waitlist_entries").select("id", { count: "exact", head: true }).eq("status", "waiting"),
      this.db.from("private_event_inquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
      this.db.from("orders").select("id", { count: "exact", head: true }).eq("status", "requires_review"),
    ]);
    return {
      nextEvent: next ?? null,
      ticketsSold: next?.sold ?? 0,
      remainingSeats: next?.remaining ?? 0,
      activeHolds: holds ?? 0,
      revenueCents: (paid ?? []).reduce((n: number, r: Row) => n + r.total_cents, 0),
      waitlistCount: waiting ?? 0,
      newInquiries: inquiries ?? 0,
      ordersRequiringReview: review ?? 0,
    };
  }

  async getSettings(): Promise<SiteSettings> {
    const { data, error } = await this.db.from("site_settings").select("key, value");
    if (error) fail(error, "getSettings");
    return Object.fromEntries((data ?? []).map((r: Row) => [r.key, r.value]));
  }
  async setSetting(key: string, value: unknown) {
    const { error } = await this.db.from("site_settings").upsert({ key, value });
    if (error) fail(error, "setSetting");
  }
  async listPublishedTestimonials(): Promise<Testimonial[]> {
    const { data, error } = await this.db.from("testimonials").select("*").eq("published", true).order("created_at", { ascending: false });
    if (error) fail(error, "listPublishedTestimonials");
    return (data ?? []).map((r: Row) => ({ id: r.id, author: r.author, text: r.text, eventId: r.event_id, published: r.published, createdAt: r.created_at }));
  }
}
