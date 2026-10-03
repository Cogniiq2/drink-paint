import { Nav } from "@/components/layout/Nav";
import { Container, Section, Eyebrow } from "@/components/ui/Section";
import type { LegalSection } from "@/content/de/legal/impressum";

/** Layout for legal texts. Content comes from src/content/de/legal/*. Placeholders are visibly marked. */
export function LegalPage({ eyebrow, title, intro, sections }: { eyebrow: string; title: string; intro?: string; sections: LegalSection[] }) {
  return (
    <>
      <Nav />
      <main id="main" className="pt-16 md:pt-[4.5rem]">
        <Section surface="ivory" size="sm">
          <Container>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="display-lg mt-4">{title}</h1>
            {intro && <p className="mt-6 text-muted max-w-[60ch]">{intro}</p>}
            <div className="mt-12 max-w-[68ch] space-y-10">
              {sections.map((s) => (
                <section key={s.heading}>
                  <h2 className="font-display text-2xl">{s.heading}</h2>
                  <div className="mt-3 space-y-2 text-[0.95rem] leading-relaxed">
                    {s.paragraphs.map((p, i) => (
                      <p key={i} className={p.includes("{{") ? "text-wine bg-wine/5 px-2 py-1 rounded-xs" : ""}>
                        {p}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </Container>
        </Section>
      </main>
    </>
  );
}
