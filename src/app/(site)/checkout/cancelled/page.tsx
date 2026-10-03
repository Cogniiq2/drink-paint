import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/layout/Nav";
import { Container, Section, Eyebrow } from "@/components/ui/Section";
import { getStore } from "@/lib/data";
import { copy } from "@/content/de/copy";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Zahlung abgebrochen", robots: { index: false, follow: false } };

export default async function CancelledPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: orderId } = await searchParams;
  const store = getStore();
  let slug: string | null = null;
  if (orderId) {
    // Idempotent: only pending orders are released. Paid orders are untouched.
    const order = await store.cancelOrder(orderId, "cancelled");
    if (order) slug = (await store.getEventById(order.eventId))?.slug ?? null;
  }
  const c = copy.cancelled;
  return (
    <>
      <Nav />
      <main id="main" className="pt-16 md:pt-[4.5rem]">
        <Section surface="ivory">
          <Container>
            <Eyebrow>{copy.checkout.eyebrow}</Eyebrow>
            <h1 className="display-lg mt-4">{c.headline}</h1>
            <p className="lede mt-5 text-muted max-w-[44ch]">{c.text}</p>
            <Link href={slug ? `/events/${slug}` : "/events"} className="btn btn-primary mt-8">
              {c.cta}
            </Link>
          </Container>
        </Section>
      </main>
    </>
  );
}
