import Image from "next/image";
import { site } from "@/config/site";
import { copy } from "@/content/de/copy";
import { Container, Section, Eyebrow } from "@/components/ui/Section";
import { Reveal } from "@/components/motion/Reveal";

const tiles = [
  { src: "/media/gallery-01.webp", alt: "Atelier-Impression", big: true },
  { src: "/media/gallery-02.webp", alt: "Atelier-Impression", big: false },
  { src: "/media/gallery-03.webp", alt: "Atelier-Impression", big: false },
  { src: "/media/gallery-04.webp", alt: "Atelier-Impression", big: false },
  { src: "/media/gallery-05.webp", alt: "Atelier-Impression", big: false },
];

/** Static editorial grid linking out — no embed, no third-party script. */
export function InstagramGrid() {
  const t = copy.instagram;
  return (
    <Section surface="bone" labelledBy="ig-title" size="sm">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div>
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <h2 id="ig-title" className="display-sm mt-3">
              {t.headline}
            </h2>
          </div>
          <a href={site.social.instagramUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            <span>{copy.cta.follow}</span>
            <span className="btn-underline" aria-hidden="true" />
          </a>
        </div>
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {tiles.map((tile, i) => (
            <Reveal as="li" key={tile.src} delay={i * 40} scale className={`${tile.big ? "col-span-2 row-span-2" : "aspect-square"} media-frame media-hover`}>
              <a href={site.social.instagramUrl} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
                <Image src={tile.src} alt={tile.alt} fill sizes={tile.big ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"} className="object-cover" quality={62} />
              </a>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
