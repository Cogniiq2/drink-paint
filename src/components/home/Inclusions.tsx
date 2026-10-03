import { copy } from "@/content/de/copy";
import type { EventView } from "@/lib/events/queries";
import { formatPrice } from "@/lib/format/money";
import { Container, Section, Eyebrow } from "@/components/ui/Section";
import { Reveal } from "@/components/motion/Reveal";

/** Typographic list, not icon cards. Price shown as the total consumer price. */
export function Inclusions({ next }: { next: EventView | null }) {
  const t = copy.inclusions;
  return (
    <Section surface="ivory" labelledBy="incl-title">
      <Container>
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <h2 id="incl-title" className="display-md mt-4 max-w-[12ch]">
              {t.headline}
            </h2>
            {next && (
              <p className="mt-8 text-muted text-sm">
                <span className="font-display text-3xl text-text tabular mr-2">{formatPrice(next.event.priceCents, next.event.currency)}</span>
                pro Person · inkl. MwSt. · Welcome Drink inklusive
              </p>
            )}
          </div>
          <ol className="md:col-span-7 md:col-start-6 hairline-t">
            {t.items.map((item, i) => (
              <Reveal as="li" key={item.title} delay={i * 50} className="grid grid-cols-[2.5rem_1fr] md:grid-cols-[3.5rem_1.1fr_1fr] gap-x-4 md:gap-x-8 py-6 hairline-b items-baseline">
                <span className="eyebrow tabular">0{i + 1}</span>
                <span className="font-display text-2xl md:text-[2rem] leading-none">{item.title}</span>
                <span className="col-start-2 md:col-start-3 text-muted mt-2 md:mt-0" style={{ textWrap: "pretty" }}>
                  {item.text}
                </span>
              </Reveal>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  );
}
