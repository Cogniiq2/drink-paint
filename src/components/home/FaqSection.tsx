import Link from "next/link";
import type { FaqItem } from "@/content/de/faq";
import { copy } from "@/content/de/copy";
import { Container, Section, Eyebrow } from "@/components/ui/Section";
import { Accordion } from "@/components/ui/Accordion";

export function FaqSection({ items, compact = false }: { items: FaqItem[]; compact?: boolean }) {
  const f = copy.faq;
  return (
    <Section surface="ivory" labelledBy="faq-title" id="faq">
      <Container>
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <Eyebrow>{f.eyebrow}</Eyebrow>
            <h2 id="faq-title" className="display-md mt-4">
              {f.headline}
            </h2>
            {compact && (
              <Link href="/faq" className="btn btn-ghost mt-6">
                <span>Alle Fragen</span>
                <span className="btn-underline" aria-hidden="true" />
              </Link>
            )}
          </div>
          <div className="md:col-span-7 md:col-start-6">
            <Accordion items={items} />
          </div>
        </div>
      </Container>
    </Section>
  );
}
