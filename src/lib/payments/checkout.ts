import "server-only";
import { env } from "@/config/env";
import { getStripe } from "./stripe";
import { siteUrl } from "@/lib/seo/metadata";
import { site } from "@/config/site";
import type { EventRecord, OrderRecord } from "@/lib/data/types";
import { formatEventDate, formatTime } from "@/lib/format/date";

/** Stripe enforces 30 min ≤ expires_at ≤ 24 h. */
const STRIPE_MIN_EXPIRY_MS = 30 * 60 * 1000 + 30_000;

export interface CheckoutSessionResult {
  url: string;
  sessionId: string;
}

/**
 * Creates a hosted Stripe Checkout session for an order whose hold already
 * exists. Payment methods come from the Stripe dashboard (cards, Apple Pay,
 * Google Pay, PayPal …). Delayed-notification methods should stay disabled in
 * the dashboard for capacity-limited events; async success is still handled.
 */
export async function createCheckoutSession(order: OrderRecord, event: EventRecord, holdExpiresAt: string): Promise<CheckoutSessionResult> {
  const stripe = getStripe();
  if (!stripe) throw new Error("stripe_not_configured");

  const base = siteUrl();
  const expiresAt = Math.floor(Math.max(new Date(holdExpiresAt).getTime(), Date.now() + STRIPE_MIN_EXPIRY_MS) / 1000);

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      ui_mode: "hosted",
      locale: "de",
      customer_email: order.email,
      client_reference_id: order.id,
      expires_at: expiresAt,
      line_items: [
        {
          quantity: order.quantity,
          price_data: {
            currency: order.currency.toLowerCase(),
            unit_amount: order.unitPriceCents,
            tax_behavior: "inclusive",
            product_data: {
              name: `${event.title}${event.edition ? ` ${event.edition}` : ""} · ${site.brand.name}`,
              description: `${formatEventDate(event.startsAt)}, ${formatTime(event.startsAt)} Uhr · ${site.address.street}, ${site.address.city} · Welcome Drink inklusive`,
              images: [`${base}${event.heroImagePath}`],
            },
          },
        },
      ],
      metadata: { orderId: order.id, orderNumber: order.orderNumber, eventId: event.id, eventSlug: event.slug, quantity: String(order.quantity) },
      payment_intent_data: {
        description: `${order.orderNumber} · ${event.title} · ${order.quantity}× Ticket`,
        metadata: { orderId: order.id, orderNumber: order.orderNumber },
      },
      success_url: `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/checkout/cancelled?order=${order.id}`,
      consent_collection: undefined,
      allow_promotion_codes: false,
      submit_type: "book",
    },
    { idempotencyKey: `checkout-${order.id}` },
  );

  if (!session.url) throw new Error("stripe_session_without_url");
  return { url: session.url, sessionId: session.id };
}

export const holdMinutes = () => env().HOLD_MINUTES;
