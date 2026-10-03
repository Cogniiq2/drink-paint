import type { Testimonial } from "@/lib/data/types";
import { copy } from "@/content/de/copy";
import { Container, Section, Eyebrow } from "@/components/ui/Section";

/**
 * Rendered only when TESTIMONIALS_ENABLED. Until real reviews exist the
 * section shows an honest empty state — never invented quotes.
 */
export function SocialProof({ testimonials }: { testimonials: Testimonial[] }) {
  const s = copy.social;
  return (
    <Section surface="bone" labelledBy="social-title" size="sm">
      <Container>
        <Eyebrow>{s.eyebrow}</Eyebrow>
        {testimonials.length === 0 ? (
          <div className="mt-4 max-w-[40ch]">
            <h2 id="social-title" className="display-sm">
              {s.emptyTitle}
            </h2>
            <p className="mt-3 text-muted">{s.emptyText}</p>
          </div>
        ) : (
          <>
            <h2 id="social-title" className="sr-only">
              {s.eyebrow}
            </h2>
            <ul className="mt-8 grid gap-10 md:grid-cols-2">
              {testimonials.slice(0, 4).map((t) => (
                <li key={t.id}>
                  <blockquote className="font-display text-2xl md:text-3xl leading-tight">„{t.text}“</blockquote>
                  <p className="mt-3 text-sm text-muted">— {t.author}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </Container>
    </Section>
  );
}
