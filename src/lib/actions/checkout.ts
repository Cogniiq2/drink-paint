"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getStore, InsufficientCapacityError } from "@/lib/data";
import { getEventBySlug, isSalesEnabled } from "@/lib/events/queries";
import { createCheckoutSession, holdMinutes } from "@/lib/payments/checkout";
import { hasStripe, paymentSimulationAllowed } from "@/config/env";
import { site } from "@/config/site";
import { copy } from "@/content/de/copy";

const schema = z.object({
  slug: z.string().min(1).max(120),
  quantity: z.coerce.number().int().min(1).max(50),
  firstName: z.string().trim().min(1, copy.checkout.errors.required).max(80),
  lastName: z.string().trim().min(1, copy.checkout.errors.required).max(80),
  email: z.string().trim().email(copy.checkout.errors.email).max(200),
  terms: z.literal("on", { message: copy.checkout.errors.terms }),
  marketing: z.enum(["on"]).optional(),
  website: z.string().max(0).optional(), // honeypot
});

export type CheckoutState = {
  error?: string;
  fieldErrors?: Partial<Record<"firstName" | "lastName" | "email" | "terms", string>>;
  remaining?: number;
};

export async function startCheckout(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: CheckoutState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0] as keyof NonNullable<CheckoutState["fieldErrors"]>;
      if (k && !fieldErrors[k]) fieldErrors[k] = issue.message;
    }
    return { fieldErrors, error: Object.keys(fieldErrors).length ? undefined : copy.checkout.errors.generic };
  }
  const input = parsed.data;
  if (input.website) return { error: copy.checkout.errors.generic }; // bot

  if (!(await isSalesEnabled())) return { error: copy.checkout.errors.salesDisabled };

  const view = await getEventBySlug(input.slug);
  if (!view || !view.availability.bookable) return { error: copy.checkout.errors.capacity(0), remaining: 0 };
  const { event, availability } = view;

  if (input.quantity > event.maxTicketsPerOrder) return { error: copy.event.maxReached(event.maxTicketsPerOrder) };
  if (input.quantity > availability.remaining) return { error: copy.checkout.errors.capacity(availability.remaining), remaining: availability.remaining };

  const store = getStore();
  let created: Awaited<ReturnType<typeof store.createOrderWithHold>>;
  try {
    created = await store.createOrderWithHold(
      {
        eventId: event.id,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email.toLowerCase(),
        phone: null,
        quantity: input.quantity,
        unitPriceCents: event.priceCents,
        currency: event.currency,
        marketingConsent: input.marketing === "on",
        locale: site.locale.default,
      },
      holdMinutes(),
    );
  } catch (e) {
    if (e instanceof InsufficientCapacityError) return { error: copy.checkout.errors.capacity(e.remaining), remaining: e.remaining };
    console.error("[checkout] createOrderWithHold failed", e);
    return { error: copy.checkout.errors.generic };
  }

  const { order, hold } = created;

  // Development without Stripe: simulate the payment step so the whole flow can be reviewed.
  if (!hasStripe()) {
    if (!paymentSimulationAllowed()) {
      await store.cancelOrder(order.id, "cancelled");
      return { error: copy.checkout.errors.salesDisabled };
    }
    redirect(`/checkout/dev-pay?order=${order.id}`);
  }

  let url: string;
  try {
    const session = await createCheckoutSession(order, event, hold.expiresAt);
    await store.attachStripeSession(order.id, session.sessionId);
    url = session.url;
  } catch (e) {
    console.error("[checkout] stripe session failed", e);
    await store.cancelOrder(order.id, "cancelled");
    return { error: copy.checkout.errors.generic };
  }
  redirect(url);
}
