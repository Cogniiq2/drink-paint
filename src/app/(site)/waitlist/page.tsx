import type { Metadata } from "next";
import { Nav } from "@/components/layout/Nav";
import { Container, Section, Eyebrow } from "@/components/ui/Section";
import { WaitlistForm } from "@/components/forms/WaitlistForm";
import { getUpcomingEvents } from "@/lib/events/queries";
import { formatDateShort } from "@/lib/format/date";
import { pageMetadata } from "@/lib/seo/metadata";
import { copy } from "@/content/de/copy";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMetadata({ title: "Warteliste", description: "Ausverkauft oder noch kein Termin? Trag dich ein, und wir sagen dir zuerst Bescheid, wenn ein Platz im BoLaGio Atelier Bayreuth frei wird.", path: "/waitlist", noIndex: true });

export default async function WaitlistPage({ searchParams }: { searchParams: Promise<{ event?: string }> }) {
  const { event } = await searchParams;
  const upcoming = await getUpcomingEvents(8);
  const options = upcoming.map((v) => ({ slug: v.event.slug, label: `${v.event.title}${v.event.edition ? ` ${v.event.edition}` : ""} · ${formatDateShort(v.event.startsAt)}${v.availability.state === "sold_out" ? " · ausverkauft" : ""}` }));
  const w = copy.waitlist;
  return (
    <>
      <Nav />
      <main id="main" className="pt-16 md:pt-[4.5rem]">
        <Section surface="bone">
          <Container>
            <div className="grid gap-12 md:grid-cols-12">
              <div className="md:col-span-5">
                <Eyebrow>{w.eyebrow}</Eyebrow>
                <h1 className="display-lg mt-4">{w.headline}</h1>
                <p className="lede mt-6 text-muted max-w-[36ch]">{w.text}</p>
              </div>
              <div className="md:col-span-6 md:col-start-7">
                <WaitlistForm options={options} defaultSlug={event} />
              </div>
            </div>
          </Container>
        </Section>
      </main>
    </>
  );
}
