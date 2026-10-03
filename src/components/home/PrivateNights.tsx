import Image from "next/image";
import Link from "next/link";
import { copy } from "@/content/de/copy";
import { Container, Section, Eyebrow } from "@/components/ui/Section";
import { Reveal } from "@/components/motion/Reveal";

export function PrivateNights() {
  const p = copy.privateNights;
  return (
    <Section surface="wine" labelledBy="private-title" className="overflow-hidden">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          <Reveal scale className="lg:col-span-6 lg:-ml-[var(--gutter)]">
            <figure className="media-frame aspect-[4/3] lg:aspect-[5/4]">
              <Image src="/media/private-table.webp" alt="Gedeckter Tisch für eine private Gruppe im Atelier" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" quality={72} />
            </figure>
          </Reveal>
          <Reveal className="lg:col-span-5 lg:col-start-8" delay={100}>
            <Eyebrow>{p.eyebrow}</Eyebrow>
            <h2 id="private-title" className="display-md mt-4">
              {p.headline}
            </h2>
            <p className="mt-6 lede text-muted max-w-[40ch]">{p.text}</p>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {p.cases.map((c) => (
                <li key={c} className="font-display text-xl">
                  {c}
                </li>
              ))}
            </ul>
            <Link href="/private-events" className="btn btn-primary mt-10 !bg-ivory !text-ink !border-ivory hover:!bg-bone">
              <span>{copy.cta.privateInquiry}</span>
              <span className="btn-arrow" aria-hidden="true">→</span>
            </Link>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
