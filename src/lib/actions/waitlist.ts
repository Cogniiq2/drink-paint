"use server";

import { z } from "zod";
import { getStore } from "@/lib/data";
import { sendMail } from "@/lib/email/mailer";
import { waitlistJoined } from "@/lib/email/templates";
import { copy } from "@/content/de/copy";

const schema = z.object({
  eventSlug: z.string().max(120).optional().or(z.literal("")),
  name: z.string().trim().min(1, copy.checkout.errors.required).max(120),
  email: z.string().trim().email(copy.checkout.errors.email).max(200),
  quantity: z.coerce.number().int().min(1).max(20).default(1),
  website: z.string().max(0).optional(),
});

export type WaitlistState = { status?: "joined" | "already"; error?: string; fieldErrors?: Partial<Record<"name" | "email", string>> };

export async function joinWaitlist(_prev: WaitlistState, formData: FormData): Promise<WaitlistState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: WaitlistState["fieldErrors"] = {};
    for (const i of parsed.error.issues) {
      const k = i.path[0] as "name" | "email";
      if (k && !fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return { fieldErrors };
  }
  const d = parsed.data;
  if (d.website) return { error: copy.checkout.errors.generic };
  const store = getStore();
  try {
    let eventId: string | null = null;
    let event = null;
    if (d.eventSlug) {
      event = await store.getPublishedEventBySlug(d.eventSlug);
      if (!event) return { error: copy.checkout.errors.generic };
      eventId = event.id;
    } else {
      // General "notify me": attach to the next published evening, else the first upcoming event.
      const upcoming = await store.listPublishedUpcomingEvents(1);
      event = upcoming[0] ?? null;
      if (!event) return { error: copy.checkout.errors.generic };
      eventId = event.id;
    }
    const { entry, created } = await store.joinWaitlist({ eventId, name: d.name, email: d.email, quantity: d.quantity });
    if (created) {
      const m = waitlistJoined(entry, event);
      await sendMail({ to: entry.email, ...m });
    }
    return { status: created ? "joined" : "already" };
  } catch (e) {
    console.error("[waitlist] failed", e);
    return { error: copy.checkout.errors.generic };
  }
}
