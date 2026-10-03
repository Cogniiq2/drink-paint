"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { env } from "@/config/env";
import { getStore } from "@/lib/data";
import { ADMIN_COOKIE, createSessionToken, passwordMatches } from "@/lib/admin/auth";
import { requireAdmin } from "@/lib/admin/session";
import { fromDateTimeLocalValue } from "@/lib/format/date";
import { sendMail } from "@/lib/email/mailer";
import { waitlistOpening, eventChanged, eventCancelled } from "@/lib/email/templates";
import { deriveAvailability } from "@/lib/inventory/availability";
import type { EventInput } from "@/lib/data/types";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const e = env();
  if (!e.ADMIN_PASSWORD || !e.ADMIN_SESSION_SECRET) return { error: "Admin ist nicht konfiguriert (ADMIN_PASSWORD / ADMIN_SESSION_SECRET fehlen)." };
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");
  if (!(await passwordMatches(password, e.ADMIN_PASSWORD))) {
    await new Promise((r) => setTimeout(r, 400));
    return { error: "Falsches Passwort." };
  }
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, await createSessionToken(e.ADMIN_SESSION_SECRET), {
    httpOnly: true,
    sameSite: "lax",
    secure: e.NODE_ENV === "production",
    path: "/",
    maxAge: 12 * 3600,
  });
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

const dt = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
const optionalDt = z.union([dt, z.literal("")]).optional();

const eventSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Nur Kleinbuchstaben, Zahlen und Bindestriche."),
  title: z.string().trim().min(1).max(120),
  edition: z.string().trim().max(40).optional().or(z.literal("")),
  subtitle: z.string().trim().max(120).optional().or(z.literal("")),
  description: z.string().trim().max(5000),
  startsAt: dt,
  endsAt: dt,
  doorsAt: dt,
  capacity: z.coerce.number().int().min(0).max(500),
  priceEuro: z.coerce.number().min(0).max(10000),
  vatRate: z.coerce.number().min(0).max(100),
  minimumAge: z.union([z.coerce.number().int().min(0).max(99), z.literal("")]).optional(),
  status: z.enum(["draft", "published", "cancelled", "archived"]),
  salesOpenAt: optionalDt,
  salesCloseAt: optionalDt,
  heroImagePath: z.string().trim().regex(/^\/media\/[a-z0-9-]+\.(webp|jpg|jpeg|png|avif)$/, "Pfad unter /media/ angeben."),
  heroImageAlt: z.string().trim().max(200),
  maxTicketsPerOrder: z.coerce.number().int().min(1).max(50),
  lowThreshold: z.coerce.number().int().min(0).max(500),
  fewThreshold: z.coerce.number().int().min(0).max(500),
});

export type EventFormState = { error?: string; ok?: boolean };

function toInput(d: z.infer<typeof eventSchema>): EventInput {
  return {
    slug: d.slug,
    title: d.title,
    edition: d.edition || null,
    subtitle: d.subtitle || null,
    description: d.description,
    startsAt: fromDateTimeLocalValue(d.startsAt),
    endsAt: fromDateTimeLocalValue(d.endsAt),
    doorsAt: fromDateTimeLocalValue(d.doorsAt),
    capacity: d.capacity,
    priceCents: Math.round(d.priceEuro * 100),
    vatRate: d.vatRate,
    minimumAge: d.minimumAge === "" || d.minimumAge === undefined ? null : d.minimumAge,
    status: d.status,
    salesOpenAt: d.salesOpenAt ? fromDateTimeLocalValue(d.salesOpenAt) : null,
    salesCloseAt: d.salesCloseAt ? fromDateTimeLocalValue(d.salesCloseAt) : null,
    heroImagePath: d.heroImagePath,
    heroImageAlt: d.heroImageAlt,
    maxTicketsPerOrder: d.maxTicketsPerOrder,
    lowThreshold: d.lowThreshold,
    fewThreshold: d.fewThreshold,
  };
}

function validate(formData: FormData): { input?: EventInput; error?: string } {
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" · ") };
  const input = toInput(parsed.data);
  if (new Date(input.endsAt) <= new Date(input.startsAt)) return { error: "Ende muss nach Beginn liegen." };
  if (new Date(input.doorsAt) > new Date(input.startsAt)) return { error: "Einlass darf nicht nach Beginn liegen." };
  if (input.fewThreshold > input.lowThreshold) return { error: "Schwelle „wenige“ muss ≤ Schwelle „niedrig“ sein." };
  return { input };
}

function revalidatePublic(slug?: string) {
  revalidatePath("/");
  revalidatePath("/events");
  if (slug) revalidatePath(`/events/${slug}`);
  revalidatePath("/sitemap.xml");
}

export async function createEventAction(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
  await requireAdmin();
  const { input, error } = validate(formData);
  if (!input) return { error };
  try {
    const ev = await getStore().createEvent(input);
    revalidatePublic(ev.slug);
    redirect(`/admin/events/${ev.id}?saved=1`);
  } catch (e) {
    if (isRedirect(e)) throw e;
    return { error: (e as Error).message === "slug_taken" ? "Dieser Slug ist bereits vergeben." : "Speichern fehlgeschlagen." };
  }
}

export async function updateEventAction(id: string, _prev: EventFormState, formData: FormData): Promise<EventFormState> {
  await requireAdmin();
  const { input, error } = validate(formData);
  if (!input) return { error };
  try {
    const ev = await getStore().updateEvent(id, input);
    revalidatePublic(ev.slug);
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message === "slug_taken" ? "Dieser Slug ist bereits vergeben." : "Speichern fehlgeschlagen." };
  }
}

export async function duplicateEventAction(id: string) {
  await requireAdmin();
  const ev = await getStore().duplicateEvent(id);
  redirect(`/admin/events/${ev.id}`);
}

export async function setEventStatusAction(id: string, status: EventInput["status"]) {
  await requireAdmin();
  const ev = await getStore().updateEvent(id, { status });
  revalidatePublic(ev.slug);
  revalidatePath("/admin/events");
}

export async function toggleCheckInAction(ticketId: string, checkedIn: boolean) {
  await requireAdmin();
  await getStore().setTicketCheckedIn(ticketId, checkedIn);
  revalidatePath("/admin/attendees");
}

export async function markRefundedAction(orderId: string) {
  await requireAdmin();
  await getStore().markOrderRefunded(orderId);
  revalidatePath("/admin/attendees");
  revalidatePath("/admin");
}

export async function updateInquiryStatusAction(id: string, status: "new" | "contacted" | "closed") {
  await requireAdmin();
  await getStore().updateInquiryStatus(id, status);
  revalidatePath("/admin/inquiries");
}

/** Emails everyone still waiting for an event that has seats again. */
export async function notifyWaitlistAction(eventId: string): Promise<void> {
  await requireAdmin();
  const store = getStore();
  const ev = await store.getEventById(eventId);
  if (!ev) return;
  const availability = deriveAvailability(ev);
  if (availability.remaining <= 0) return;
  const waiting = (await store.listWaitlist(eventId)).filter((w) => w.status === "waiting");
  const results = await Promise.all(waiting.map((w) => sendMail({ to: w.email, ...waitlistOpening(w, ev, availability.remaining) })));
  const sentIds = waiting.filter((_, i) => results[i].ok).map((w) => w.id);
  await store.markWaitlistNotified(sentIds);
  revalidatePath("/admin/waitlist");
  console.info(`[waitlist] notified ${sentIds.length} for ${ev.slug}`);
}

export async function saveSettingAction(formData: FormData) {
  await requireAdmin();
  const key = String(formData.get("key") ?? "");
  const raw = String(formData.get("value") ?? "");
  if (!/^[a-z0-9_.]+$/i.test(key)) return;
  let value: unknown = raw;
  if (raw === "true") value = true;
  else if (raw === "false") value = false;
  await getStore().setSetting(key, value);
  revalidatePublic();
  revalidatePath("/faq");
  revalidatePath("/impressum");
  revalidatePath("/datenschutz");
  revalidatePath("/ticketbedingungen");
  revalidatePath("/admin/settings");
}

function isRedirect(e: unknown): boolean {
  return typeof e === "object" && e !== null && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT");
}

export type NotifyState = { sent?: number; error?: string };

/** Sends a change or cancellation notice to every paid guest of an event. */
export async function notifyGuestsAction(eventId: string, _prev: NotifyState, formData: FormData): Promise<NotifyState> {
  await requireAdmin();
  const kind = String(formData.get("kind"));
  const note = String(formData.get("note") ?? "").trim();
  if (!note || (kind !== "changed" && kind !== "cancelled")) return { error: "Bitte Art und Nachricht angeben." };
  const store = getStore();
  const ev = await store.getEventById(eventId);
  if (!ev) return { error: "Abend nicht gefunden." };
  const orders = await store.listPaidOrdersForEvent(eventId);
  const results = await Promise.all(orders.map((o) => sendMail({ to: o.email, ...(kind === "changed" ? eventChanged(o, ev, note) : eventCancelled(o, ev, note)) })));
  if (kind === "cancelled") await store.updateEvent(eventId, { status: "cancelled" });
  revalidatePublic(ev.slug);
  return { sent: results.filter((r) => r.ok).length };
}
