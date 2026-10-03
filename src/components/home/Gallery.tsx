import Image from "next/image";
import { copy } from "@/content/de/copy";
import { Container, Section, Eyebrow } from "@/components/ui/Section";
import { Reveal } from "@/components/motion/Reveal";
import { Parallax } from "@/components/motion/Parallax";

/** Asymmetric editorial composition; one edge-to-edge frame, two offset portraits. */
export function Gallery() {
  const g = copy.gallery;
  return (
    <Section surface="dark" labelledBy="gallery-title" className="overflow-hidden">
      <Container>
        <div className="grid gap-6 md:grid-cols-12 md:items-end mb-14 md:mb-24">
          <div className="md:col-span-6">
            <Eyebrow>{g.eyebrow}</Eyebrow>
            <h2 id="gallery-title" className="display-md mt-4">
              {g.headline}
            </h2>
          </div>
          <p className="md:col-span-4 md:col-start-9 text-muted lede">{g.text}</p>
        </div>
      </Container>

      <Reveal scale className="w-full">
        <figure className="media-frame aspect-[16/10] md:aspect-[21/9] !rounded-none">
          <Image src="/media/table-wide.webp" alt="Der lange Tisch des Ateliers, gedeckt mit Leinwänden, Farben und Gläsern" fill sizes="100vw" className="object-cover" quality={74} />
        </figure>
      </Reveal>

      <Container>
        <div className="grid grid-cols-12 gap-4 md:gap-8 mt-6 md:mt-10">
          <Reveal scale className="col-span-7 md:col-span-4 md:col-start-2 md:mt-24">
            <Parallax amount={40}>
              <figure className="media-frame aspect-[4/5]">
                <Image src="/media/wine-pour.webp" alt="Ein Glas Rotwein wird eingeschenkt" fill sizes="(min-width: 768px) 30vw, 60vw" className="object-cover" quality={74} />
              </figure>
            </Parallax>
          </Reveal>
          <Reveal scale className="col-span-5 md:col-span-3 md:col-start-7 mt-16 md:mt-0" delay={120}>
            <Parallax amount={-30}>
              <figure className="media-frame aspect-[4/5]">
                <Image src="/media/brush-detail.webp" alt="Ein Pinsel setzt die erste Farbe auf die Leinwand" fill sizes="(min-width: 768px) 22vw, 40vw" className="object-cover" quality={74} />
              </figure>
            </Parallax>
          </Reveal>
          <Reveal className="col-span-12 md:col-span-3 md:col-start-10 md:self-end" delay={200}>
            <p className="font-display text-2xl md:text-3xl leading-tight mt-10 md:mt-0">
              Du kommst wegen des Abends. <span className="italic opacity-80">Das Bild nimmst du mit.</span>
            </p>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
