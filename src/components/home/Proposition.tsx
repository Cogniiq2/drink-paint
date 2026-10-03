import { copy } from "@/content/de/copy";
import { Container, Section } from "@/components/ui/Section";
import { Reveal } from "@/components/motion/Reveal";
import { BrushStroke } from "@/components/brand/BrushStroke";

export function Proposition() {
  const p = copy.proposition;
  return (
    <Section surface="ivory" className="overflow-hidden">
      <Container>
        <div className="grid gap-12 md:grid-cols-12 md:items-end">
          <Reveal as="h2" className="display-lg md:col-span-8 md:col-start-1">
            {p.lines.map((l, i) => (
              <span key={l} className={`block ${i === 2 || i === 3 ? "italic-accent" : ""}`}>
                {l}
              </span>
            ))}
          </Reveal>
          <Reveal className="md:col-span-3 md:col-start-10 md:pb-3" delay={120}>
            <p className="lede">{p.aside}</p>
            <p className="eyebrow mt-6">{p.rarity}</p>
          </Reveal>
        </div>
        <div className="mt-20 md:mt-28 text-wine max-w-[720px]">
          <BrushStroke mode="scroll" />
        </div>
      </Container>
    </Section>
  );
}
