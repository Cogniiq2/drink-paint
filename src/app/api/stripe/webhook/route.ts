import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/payments/stripe";
import { env } from "@/config/env";
import { getStore } from "@/lib/data";
import { fulfilOrder } from "@/lib/payments/fulfilment";
import { sendMail } from "@/lib/email/mailer";
import { refundConfirmation } from "@/lib/email/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Payment truth. Signature-verified, idempotent per Stripe event id.
 * Returns 200 for handled/ignored events, 400 for bad signatures, 500 to ask
 * Stripe to retry (idempotency record is released first).
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = env().STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, secret);
  } catch (e) {
    console.warn("[webhook] signature failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const store = getStore();
  const fresh = await store.recordWebhookEvent(event.id, event.type);
  if (!fresh) return NextResponse.json({ received: true, duplicate: true });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        const orderId = s.metadata?.orderId ?? s.client_reference_id;
        if (!orderId) break;
        if (s.payment_status === "paid") await fulfilOrder(orderId, typeof s.payment_intent === "string" ? s.payment_intent : (s.payment_intent?.id ?? null));
        // "unpaid" → delayed method; wait for async_payment_succeeded.
        break;
      }
      case "checkout.session.async_payment_succeeded": {
        const s = event.data.object;
        const orderId = s.metadata?.orderId ?? s.client_reference_id;
        if (orderId) await fulfilOrder(orderId, typeof s.payment_intent === "string" ? s.payment_intent : (s.payment_intent?.id ?? null));
        break;
      }
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const s = event.data.object;
        const orderId = s.metadata?.orderId ?? s.client_reference_id;
        if (orderId) await store.cancelOrder(orderId, event.type === "checkout.session.expired" ? "expired" : "cancelled");
        break;
      }
      case "charge.refunded": {
        const c = event.data.object;
        const pi = typeof c.payment_intent === "string" ? c.payment_intent : c.payment_intent?.id;
        if (!pi || !c.refunded) break;
        const order = await store.getOrderByPaymentIntent(pi);
        if (order && order.status !== "refunded") {
          await store.markOrderRefunded(order.id);
          const ev = await store.getEventById(order.eventId);
          if (ev) await sendMail({ to: order.email, ...refundConfirmation(order, ev) });
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error(`[webhook] ${event.type} failed`, e);
    await store.releaseWebhookEvent(event.id);
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
