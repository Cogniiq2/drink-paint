import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/layout/Nav";
import { Container, Section, Eyebrow } from "@/components/ui/Section";
import { BrushStroke } from "@/components/brand/BrushStroke";
import { ShareButton } from "@/components/events/ShareButton";
import { PendingRefresh } from "@/components/checkout/PendingRefresh";
import { TrackOnMount } from "@/components/analytics/TrackOnMount";
import { getStore } from "@/lib/data";
import { getStripe } from "@/lib/payments/stripe";
import { fulfilOrder } from "@/lib/payments/fulfilment";
import { ticketQrDataUrl } from "@/lib/tickets/qr";
import { formatDateLong, formatTime, formatWeekday } from "@/lib/format/date";
import { formatMoney } from "@/lib/format/money";
import { site } from "@/config/site";
import { copy } from "@/content/de/copy";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dein Platz ist reserviert", robots: { index: false, follow: false } };

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  if (!session_id) redirect("/events");
  const store = getStore();
  let order = await store.getOrderByStripeSession(session_id);
  if (!order) redirect("/events");

  // Webhook is the source of truth, but if it is delayed we verify directly
  // with Stripe (server-side, signed API call) — never from the browser.
  if (order.status === "pending") {
    const stripe = getStripe();
    if (stripe && !session_id.startsWith("dev_")) {
      try {
        const session = await stripe.checkout.sessions.retrieve(session_id);
        if (session.payment_status === "paid") {
          await fulfilOrder(order.id, typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null));
          order = (await store.getOrderById(order.id)) ?? order;
        }
      } catch (e) {
        console.warn("[success] stripe verification failed", e);
      }
    }
  }

  const event = await store.getEventById(order.eventId);
  if (!event) redirect("/events");
  const s = copy.success;

  if (order.status === "pending") {
    return (
      <Shell>
        <PendingRefresh />
        <Eyebrow>{copy.checkout.eyebrow}</Eyebrow>
        <h1 className="display-lg mt-4">{s.pendingHeadline}</h1>
        <p className="lede mt-5 text-muted max-w-[40ch]">{s.pendingText}</p>
      </Shell>
    );
  }

  if (order.status === "requires_review") {
    return (
      <Shell>
        <Eyebrow>{copy.checkout.eyebrow}</Eyebrow>
        <h1 className="display-lg mt-4">{s.reviewHeadline}</h1>
        <p className="lede mt-5 text-muted max-w-[46ch]">{s.reviewText}</p>
        <p className="mt-6 text-sm">
          {s.reference}: <span className="font-mono">{order.orderNumber}</span>
        </p>
      </Shell>
    );
  }

  if (order.status !== "paid") redirect(`/checkout/cancelled?order=${order.id}`);

  const tickets = await store.listTicketsForOrder(order.id);
  const qrs = await Promise.all(tickets.map((t) => ticketQrDataUrl(t.code)));

  return (
    <Shell>
      <TrackOnMount event={{ name: "checkout_completed", props: { slug: event.slug, quantity: order.quantity, valueCents: order.totalCents } }} />
      <div className="max-w-[420px] text-wine">
        <BrushStroke mode="enter" variant="short" />
      </div>
      <h1 className="display-lg mt-6">{s.headline}</h1>
      <p className="lede mt-5 text-muted">
        {s.sub(order.quantity)} {s.emailNote(order.email)}
      </p>

      <dl className="mt-12 max-w-xl hairline-t">
        {[
          ["Abend", `${event.title}${event.edition ? ` ${event.edition}` : ""}`],
          ["Datum", `${formatWeekday(event.startsAt)}, ${formatDateLong(event.startsAt)}`],
          [s.arrival, `${formatTime(event.doorsAt)} Uhr · Beginn ${formatTime(event.startsAt)} Uhr`],
          [s.venue, `${site.address.street}, ${site.address.postalCode} ${site.address.city}`],
          [s.tickets, `${order.quantity} · ${formatMoney(order.totalCents, order.currency)}`],
          [s.reference, order.orderNumber],
        ].map(([k, v]) => (
          <div key={k} className="grid grid-cols-[7rem_1fr] md:grid-cols-[9rem_1fr] gap-4 py-3 hairline-b text-sm">
            <dt className="text-muted">{k}</dt>
            <dd className={k === s.reference ? "font-mono" : ""}>{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex flex-wrap gap-3">
        <a href={`/api/events/${event.slug}/calendar.ics`} className="btn btn-outline">
          {copy.cta.calendar}
        </a>
        <a href={site.address.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
          {copy.cta.openRoute}
        </a>
        <ShareButton title={`${event.title} · ${site.brand.name}`} text={`Ich bin dabei: ${formatWeekday(event.startsAt)}, ${formatDateLong(event.startsAt)} – Paint & Drink in Bayreuth`} path={`/events/${event.slug}`} />
      </div>

      <section className="mt-16" aria-labelledby="tickets-title">
        <h2 id="tickets-title" className="display-sm">
          Deine Tickets
        </h2>
        <p className="mt-2 text-sm text-muted">Zeig den Code am Einlass vor – auf dem Handy oder aus der E-Mail.</p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl">
          {tickets.map((t, i) => (
            <li key={t.id} className="border border-hairline-strong rounded-xs p-5 flex gap-4 items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrs[i]} alt={`QR-Code Ticket ${i + 1}`} width={96} height={96} className="shrink-0 rounded-xs" />
              <div>
                <p className="eyebrow">Ticket {i + 1}</p>
                <p className="font-mono text-xs mt-1 whitespace-nowrap">{t.code}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-16">
        <Link href="/" className="btn btn-ghost">
          <span>Zur Startseite</span>
          <span className="btn-underline" aria-hidden="true" />
        </Link>
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main id="main" className="pt-16 md:pt-[4.5rem]">
        <Section surface="ivory">
          <Container>{children}</Container>
        </Section>
      </main>
    </>
  );
}
