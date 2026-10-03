import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Nav } from "@/components/layout/Nav";
import { Container, Section, Eyebrow } from "@/components/ui/Section";
import { Reveal } from "@/components/motion/Reveal";
import { BrushStroke } from "@/components/brand/BrushStroke";
import { Evening } from "@/components/home/Evening";
import { Inclusions } from "@/components/home/Inclusions";
import { Location } from "@/components/home/Location";
import { getNextEvent } from "@/lib/events/queries";
import { pageMetadata } from "@/lib/seo/metadata";
import { copy } from "@/content/de/copy";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMetadata({
  title: "Das Atelier – Malen mit Wein in Bayreuth",
  description: "Ein langer Tisch in der Schulstraße, zwanzig Leinwände, warmes Licht. So fühlt sich ein Paint & Drink Abend im BoLaGio Atelier Bayreuth an – ohne Vorkenntnisse, mit Welcome Drink.",
  path: "/atelier",
  image: "/media/atelier-room.webp",
});

export default async function AtelierPage() {
  const next = await getNextEvent();
  return (
    <>
      <Nav />
      <main id="main" className="pt-16 md:pt-[4.5rem]">
        <Section surface="ivory" size="sm" className="!pb-0">
          <Container>
            <Eyebrow>{copy.gallery.eyebrow}</Eyebrow>
            <h1 className="display-xl mt-4 max-w-[10ch]">Ein Raum, der nach Farbe riecht.</h1>
            <p className="lede mt-8 text-muted max-w-[44ch]">
              Keine Kursatmosphäre, kein Bastelgeruch. Ein langer Tisch, ein paar offene Flaschen, zwanzig Staffeleien. Du bekommst ein Glas, einen Platz und ein Motiv – und drei Stunden, in denen niemand aufs Handy schaut.
            </p>
          </Container>
        </Section>
        <Section surface="ivory" size="sm">
          <Container wide>
            <Reveal scale>
              <figure className="media-frame aspect-[16/10] md:aspect-[21/9]">
                <Image src="/media/atelier-room.webp" alt="Das Atelier in der Schulstraße: ein langer Tisch, Staffeleien, warmes Licht" fill priority sizes="100vw" quality={74} className="object-cover" />
              </figure>
            </Reveal>
          </Container>
          <Container>
            <div className="grid grid-cols-12 gap-4 md:gap-8 mt-10 md:mt-16">
              <Reveal scale className="col-span-6 md:col-span-4 md:col-start-2">
                <figure className="media-frame aspect-[4/5]">
                  <Image src="/media/arrival.webp" alt="Die Tür zum Atelier, abends" fill sizes="(min-width: 768px) 30vw, 50vw" quality={72} className="object-cover" />
                </figure>
              </Reveal>
              <Reveal className="col-span-6 md:col-span-5 md:col-start-7 self-center" delay={120}>
                <p className="font-display text-2xl md:text-4xl leading-tight">
                  Das Motiv des Abends steht vorne. <span className="italic-accent">Was du daraus machst, steht dir frei.</span>
                </p>
                <div className="mt-8 max-w-[320px] text-wine">
                  <BrushStroke mode="enter" variant="short" />
                </div>
              </Reveal>
            </div>
          </Container>
        </Section>
        <Evening />
        <Inclusions next={next} />
        <Section surface="dark" size="sm">
          <Container>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <p className="display-md max-w-[14ch]">Der nächste Abend wartet.</p>
              <Link href={next ? `/events/${next.event.slug}` : "/events"} className="btn btn-primary !bg-ivory !text-ink !border-ivory hover:!bg-bone">
                <span>{copy.cta.chooseEvening}</span>
                <span className="btn-arrow" aria-hidden="true">→</span>
              </Link>
            </div>
          </Container>
        </Section>
        <Location />
      </main>
    </>
  );
}
