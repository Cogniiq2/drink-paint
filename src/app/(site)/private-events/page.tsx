import type { Metadata } from "next";
import Image from "next/image";
import { Nav } from "@/components/layout/Nav";
import { Container, Section, Eyebrow } from "@/components/ui/Section";
import { Reveal } from "@/components/motion/Reveal";
import { PrivateInquiryForm } from "@/components/forms/PrivateInquiryForm";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { copy } from "@/content/de/copy";

export const metadata: Metadata = pageMetadata({
  title: "Private Events – JGA, Geburtstag & Teamevent in Bayreuth",
  description: "Das Atelier exklusiv für eure Gruppe: JGA, Geburtstag, Teamevent oder private Feier als Paint & Drink Abend in Bayreuth. Eigenes Motiv, eigene Musik, eigenes Tempo. Jetzt anfragen.",
  path: "/private-events",
  image: "/media/private-table.webp",
});

const cases = [
  { title: "JGA", text: "Ein Abend, der nicht in der nächsten Bar endet, sondern mit zwanzig Bildern von derselben Braut. Oder demselben Bräutigam." },
  { title: "Geburtstag", text: "Der Tisch gehört dir und deinen Leuten. Wir kümmern uns um Farben, Gläser und das Motiv, du um die Gästeliste." },
  { title: "Teamabend", text: "Kein Workshop-Charakter, kein Flipchart. Ein gemeinsamer Abend, bei dem alle etwas in der Hand haben – und am Ende etwas mitnehmen." },
  { title: "Private Feier", text: "Jubiläum, Abschied, Wiedersehen. Ihr bringt den Anlass, wir den Rahmen." },
];

export default function PrivateEventsPage() {
  const p = copy.privateNights;
  return (
    <>
      <Nav overHero ctaHref="#anfrage" />
      <main id="main">
        <JsonLd data={breadcrumbJsonLd([{ name: "Start", path: "/" }, { name: "Private Events", path: "/private-events" }])} />
        <section className="relative min-h-[70svh] surface-dark flex items-end overflow-hidden">
          <Image src="/media/private-table.webp" alt="" fill priority sizes="100vw" quality={70} className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-ink/30" aria-hidden="true" />
          <Container className="relative pb-14 pt-40">
            <p className="eyebrow !text-bone/80 fade">{p.eyebrow}</p>
            <h1 className="display-xl mt-4 max-w-[12ch]">
              <span className="mask-line"><span>Der Tisch,</span></span>
              <span className="mask-line"><span style={{ ["--delay" as string]: "120ms" }}>nur für euch.</span></span>
            </h1>
            <p className="lede mt-7 max-w-[40ch] text-bone/90 rise" style={{ ["--delay" as string]: "400ms" }}>
              {p.text}
            </p>
          </Container>
        </section>

        <Section surface="ivory">
          <Container>
            <ol className="grid md:grid-cols-2 gap-x-16">
              {cases.map((c, i) => (
                <Reveal as="li" key={c.title} delay={i * 60} className="py-8 hairline-b md:first:hairline-t md:[&:nth-child(2)]:hairline-t">
                  <h2 className="font-display text-4xl md:text-5xl leading-none">{c.title}</h2>
                  <p className="mt-4 text-muted max-w-[40ch]" style={{ textWrap: "pretty" }}>
                    {c.text}
                  </p>
                </Reveal>
              ))}
            </ol>
            <p className="mt-12 text-sm text-muted max-w-[52ch]">
              Gruppengrößen, Preise und Zeiten besprechen wir persönlich – jeder Abend ist anders. Wir antworten innerhalb von zwei Werktagen.
            </p>
          </Container>
        </Section>

        <Section surface="bone" id="anfrage">
          <Container>
            <div className="grid gap-12 md:grid-cols-12">
              <div className="md:col-span-4">
                <Eyebrow>Anfrage</Eyebrow>
                <h2 className="display-md mt-4">{copy.privateForm.headline}</h2>
                <p className="mt-5 text-muted max-w-[30ch]">{copy.privateForm.text}</p>
              </div>
              <div className="md:col-span-7 md:col-start-6">
                <PrivateInquiryForm />
              </div>
            </div>
          </Container>
        </Section>
      </main>
    </>
  );
}
