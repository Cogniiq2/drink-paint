import "server-only";
import { getStore } from "@/lib/data";
import { sendMail } from "@/lib/email/mailer";
import { purchaseConfirmation, orderRequiresReview } from "@/lib/email/templates";
import { ticketQrDataUrl } from "@/lib/tickets/qr";
import { env } from "@/config/env";

/**
 * Called from the webhook after Stripe confirms payment. Idempotent: the
 * store's confirmOrderPaid is a no-op for already-paid orders, and we only
 * send the confirmation email when the status actually transitioned.
 */
export async function fulfilOrder(orderId: string, paymentIntentId: string | null) {
  const store = getStore();
  const before = await store.getOrderById(orderId);
  if (!before) throw new Error(`order_not_found:${orderId}`);
  if (before.status === "paid") return { status: "paid" as const, alreadyProcessed: true };

  const { order, tickets } = await store.confirmOrderPaid(orderId, paymentIntentId);
  const event = await store.getEventById(order.eventId);
  if (!event) throw new Error(`event_not_found:${order.eventId}`);

  if (order.status === "requires_review") {
    const admin = env().ADMIN_NOTIFICATION_EMAIL;
    if (admin) {
      const m = orderRequiresReview(order, event);
      await sendMail({ to: admin, ...m });
    }
    return { status: "requires_review" as const, alreadyProcessed: false };
  }

  const qrs = await Promise.all(tickets.map((t) => ticketQrDataUrl(t.code)));
  const mail = purchaseConfirmation(order, event, tickets, qrs);
  await sendMail({ to: order.email, ...mail });
  return { status: "paid" as const, alreadyProcessed: false };
}
