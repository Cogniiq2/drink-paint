import type { Metadata } from "next";
import { Nav } from "@/components/layout/Nav";
import { UpcomingNights } from "@/components/home/UpcomingNights";
import { Container, Section, Eyebrow } from "@/components/ui/Section";
import { JsonLd } from "@/components/seo/JsonLd";
import { getUpcomingEvents } from "@/lib/events/queries";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, eventJsonLd } from "@/lib/seo/jsonld";
import { copy } from "@/content/de/copy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Abende – Paint & Drink in Bayreuth",
  description: "Alle kommenden Paint & Drink Abende im BoLaGio Atelier Bayreuth. Rund 20 Plätze pro Abend, Leinwand und Welcome Drink inklusive. Jetzt Platz sichern.",
  path: "/events",
});

export default async function EventsPage() {
  const events = await getUpcomingEvents(8);
  return (
    <>
      <Nav />
      <main id="main" className="pt-16 md:pt-[4.5rem]">
        <JsonLd data={[breadcrumbJsonLd([{ name: copy.event.breadcrumbHome, path: "/" }, { name: copy.event.breadcrumbEvents, path: "/events" }]), ...events.map(eventJsonLd)]} />
        <Section surface="ivory" size="sm" className="!pb-0">
          <Container>
            <Eyebrow>{copy.upcoming.eyebrow}</Eyebrow>
            <h1 className="display-lg mt-4">{copy.upcoming.headline}</h1>
            <p className="lede mt-6 text-muted max-w-[44ch]">{copy.upcoming.sub}</p>
          </Container>
        </Section>
        <UpcomingNights events={events} headline={false} />
      </main>
    </>
  );
}
