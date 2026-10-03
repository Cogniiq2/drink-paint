import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Nav } from "@/components/layout/Nav";
import { Container, Section, Eyebrow } from "@/components/ui/Section";
import { getStore } from "@/lib/data";
import { paymentSimulationAllowed } from "@/config/env";
import { fulfilOrder } from "@/lib/payments/fulfilment";
import { formatMoney } from "@/lib/format/money";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Entwicklung · Zahlung simulieren", robots: { index: false, follow: false } };

/**
 * DEVELOPMENT ONLY. Stands in for Stripe Checkout when no key is configured,
 * so the hold → paid → confirmation path and emails can be reviewed locally.
 * Returns 404 unless Stripe is absent AND the site URL is localhost.
 */
export default async function DevPayPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  if (!paymentSimulationAllowed()) notFound();
  const { order: orderId } = await searchParams;
  if (!orderId) notFound();
  const store = getStore();
  const order = await store.getOrderById(orderId);
  if (!order) notFound();
  const event = await store.getEventById(order.eventId);
  if (!event) notFound();

  const id = order.id;
  async function pay() {
    "use server";
    if (!paymentSimulationAllowed()) notFound();
    await getStore().attachStripeSession(id, `dev_${id}`);
    await fulfilOrder(id, `pi_dev_${id}`);
    redirect(`/checkout/success?session_id=dev_${id}`);
  }
  async function cancel() {
    "use server";
    redirect(`/checkout/cancelled?order=${id}`);
  }

  return (
    <>
      <Nav />
      <main id="main" className="pt-16 md:pt-[4.5rem]">
        <Section surface="bone">
          <Container>
            <Eyebrow>Entwicklungsmodus · kein Stripe-Schlüssel konfiguriert</Eyebrow>
            <h1 className="display-md mt-4">Zahlung simulieren</h1>
            <p className="mt-4 text-muted max-w-[48ch]">
              Diese Seite ersetzt Stripe Checkout nur in der Entwicklung. Bestellung {order.orderNumber}: {order.quantity} × {event.title}, {formatMoney(order.totalCents, order.currency)}.
            </p>
            <div className="mt-8 flex gap-4">
              <form action={pay}>
                <button className="btn btn-primary">Zahlung erfolgreich</button>
              </form>
              <form action={cancel}>
                <button className="btn btn-outline">Abbrechen</button>
              </form>
            </div>
          </Container>
        </Section>
      </main>
    </>
  );
}
