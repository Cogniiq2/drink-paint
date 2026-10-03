import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/layout/Nav";
import { Container, Section, Eyebrow } from "@/components/ui/Section";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getEventBySlug, isSalesEnabled } from "@/lib/events/queries";
import { formatDateLong, formatTime, formatWeekday } from "@/lib/format/date";
import { holdMinutes } from "@/lib/payments/checkout";
import { copy } from "@/content/de/copy";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Buchung", robots: { index: false, follow: false } };

export default async function CheckoutPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ qty?: string }> }) {
  const [{ slug }, { qty }] = await Promise.all([params, searchParams]);
  const [view, salesEnabled] = await Promise.all([getEventBySlug(slug), isSalesEnabled()]);
  if (!view) redirect("/events");
  const { event, availability } = view;
  if (!availability.bookable || !salesEnabled) redirect(`/events/${slug}`);
  const requested = Math.max(1, Math.min(Number(qty) || 1, event.maxTicketsPerOrder, availability.remaining));

  return (
    <>
      <Nav ctaHref={`/events/${slug}`} />
      <main id="main" className="pt-16 md:pt-[4.5rem]">
        <Section surface="ivory" size="sm">
          <Container>
            <Link href={`/events/${slug}`} className="text-sm text-muted hover:text-text">
              ← {copy.cta.back}
            </Link>
            <Eyebrow className="mt-8">{copy.checkout.eyebrow}</Eyebrow>
            <h1 className="display-lg mt-3">{copy.checkout.headline}</h1>
            <p className="mt-4 text-muted">
              {event.title}
              {event.edition ? ` ${event.edition}` : ""} · {formatWeekday(event.startsAt)}, {formatDateLong(event.startsAt)} · {formatTime(event.startsAt)} Uhr
            </p>
            <div className="mt-12">
              <CheckoutForm
                event={{
                  slug: event.slug,
                  title: event.title,
                  edition: event.edition,
                  startsAt: event.startsAt,
                  doorsAt: event.doorsAt,
                  endsAt: event.endsAt,
                  priceCents: event.priceCents,
                  currency: event.currency,
                  vatRate: event.vatRate,
                  minimumAge: event.minimumAge,
                  maxPerOrder: Math.min(event.maxTicketsPerOrder, availability.remaining),
                }}
                initialQuantity={requested}
                holdMinutes={holdMinutes()}
              />
            </div>
          </Container>
        </Section>
      </main>
    </>
  );
}
