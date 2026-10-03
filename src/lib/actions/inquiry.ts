"use server";

import { z } from "zod";
import { getStore } from "@/lib/data";
import { sendMail } from "@/lib/email/mailer";
import { inquiryNotification, inquiryReceipt } from "@/lib/email/templates";
import { env } from "@/config/env";
import { site } from "@/config/site";
import { copy } from "@/content/de/copy";

const schema = z.object({
  name: z.string().trim().min(1, copy.checkout.errors.required).max(120),
  email: z.string().trim().email(copy.checkout.errors.email).max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  eventType: z.string().trim().min(1, copy.checkout.errors.required).max(60),
  guests: z.coerce.number().int().min(1, copy.checkout.errors.required).max(500),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  alternativeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  message: z.string().trim().max(4000).optional().or(z.literal("")),
  website: z.string().max(0).optional(),
});

export type InquiryState = { status?: "sent"; error?: string; fieldErrors?: Partial<Record<"name" | "email" | "eventType" | "guests" | "preferredDate", string>> };

export async function submitInquiry(_prev: InquiryState, formData: FormData): Promise<InquiryState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: InquiryState["fieldErrors"] = {};
    for (const i of parsed.error.issues) {
      const k = i.path[0] as keyof NonNullable<InquiryState["fieldErrors"]>;
      if (k && !fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return { fieldErrors };
  }
  const d = parsed.data;
  if (d.website) return { error: copy.checkout.errors.generic };
  try {
    const q = await getStore().createInquiry({
      name: d.name,
      email: d.email.toLowerCase(),
      phone: d.phone || null,
      eventType: d.eventType,
      guests: d.guests,
      preferredDate: d.preferredDate || null,
      alternativeDate: d.alternativeDate || null,
      message: d.message ?? "",
    });
    const recipient = env().PRIVATE_EVENTS_RECIPIENT ?? env().ADMIN_NOTIFICATION_EMAIL ?? site.contact.email;
    await Promise.all([sendMail({ to: q.email, ...inquiryReceipt(q) }), sendMail({ to: recipient, replyTo: q.email, ...inquiryNotification(q) })]);
    return { status: "sent" };
  } catch (e) {
    console.error("[inquiry] failed", e);
    return { error: copy.checkout.errors.generic };
  }
}
