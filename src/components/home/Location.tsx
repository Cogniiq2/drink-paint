import Image from "next/image";
import { site } from "@/config/site";
import { copy } from "@/content/de/copy";
import { Container, Section, Eyebrow } from "@/components/ui/Section";
import { Reveal } from "@/components/motion/Reveal";

export function Location() {
  const l = copy.location;
  return (
    <Section surface="ivory" labelledBy="loc-title">
      <Container>
        <div className="grid gap-12 md:grid-cols-12 md:items-center">
          <div className="md:col-span-5">
            <Eyebrow>{l.eyebrow}</Eyebrow>
            <h2 id="loc-title" className="display-md mt-4">
              {l.headline}
            </h2>
            <address className="not-italic font-display text-2xl md:text-3xl mt-8 leading-tight">
              {site.address.street}
              <br />
              {site.address.postalCode} {site.address.city}
            </address>
            <p className="mt-6 text-muted max-w-[36ch]">{l.text}</p>
            <a href={site.address.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-8">
              <span>{copy.cta.openRoute}</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
          <Reveal scale className="md:col-span-6 md:col-start-7">
            <figure className="media-frame aspect-[10/7]">
              <Image src="/media/exterior-night.webp" alt="Die Schulstraße in Bayreuth am Abend" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" quality={70} />
            </figure>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
