import Image from "next/image";
import { copy } from "@/content/de/copy";
import { Container, Section, Eyebrow } from "@/components/ui/Section";
import { Reveal } from "@/components/motion/Reveal";

/** The flow of the evening — a vertical reading rhythm with a sticky image on desktop. */
export function Evening() {
  const e = copy.evening;
  return (
    <Section surface="dark" labelledBy="evening-title">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <Eyebrow>{e.eyebrow}</Eyebrow>
              <h2 id="evening-title" className="display-md mt-4">
                {e.headline}
              </h2>
              <Reveal scale className="mt-10 hidden lg:block">
                <figure className="media-frame aspect-[4/5] max-w-[420px]">
                  <Image src="/media/guests-painting.webp" alt="Hände mit Pinseln über einer Leinwand, warmes Licht" fill sizes="30vw" className="object-cover" quality={72} />
                </figure>
              </Reveal>
            </div>
          </div>
          <ol className="lg:col-span-6 lg:col-start-7">
            {e.steps.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 40} className="grid grid-cols-[6rem_1fr] md:grid-cols-[8rem_1fr] gap-6 py-8 hairline-b first:hairline-t">
                <span className="eyebrow pt-2">{s.time}</span>
                <div>
                  <h3 className="font-display text-3xl md:text-[2.5rem] leading-none">{s.title}</h3>
                  <p className="mt-3 text-muted max-w-[36ch]" style={{ textWrap: "pretty" }}>
                    {s.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  );
}
