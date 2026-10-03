import Link from "next/link";
import { copy } from "@/content/de/copy";
import type { EventView } from "@/lib/events/queries";
import { formatDateLong, formatWeekday } from "@/lib/format/date";
import { Container, Section } from "@/components/ui/Section";
import { Reveal } from "@/components/motion/Reveal";
import { BrushStroke } from "@/components/brand/BrushStroke";
import { AvailabilityBadge } from "@/components/events/AvailabilityBadge";
import { Magnetic } from "@/components/motion/Magnetic";

export function FinalCta({ next, salesEnabled }: { next: EventView | null; salesEnabled: boolean }) {
  const c = copy.finalCta;
  const href = next ? `/events/${next.event.slug}` : "/events";
  const soldOut = next?.availability.state === "sold_out";
  return (
    <Section surface="dark" className="overflow-hidden">
      <Container>
        <Reveal>
          <h2 className="display-xl">
            <span className="block">{c.headline[0]}</span>
            <span className="block italic opacity-85">{c.headline[1]}</span>
          </h2>
        </Reveal>
        <div className="max-w-[520px] mt-8 text-bone/70">
          <BrushStroke mode="enter" variant="short" />
        </div>
        <Reveal className="mt-12 flex flex-col md:flex-row md:items-end md:justify-between gap-8" delay={100}>
          <div>
            {next ? (
              <>
                <p className="lede">
                  {formatWeekday(next.event.startsAt)}, {formatDateLong(next.event.startsAt)}
                </p>
                <AvailabilityBadge availability={next.availability} className="mt-2 text-muted" />
              </>
            ) : (
              <p className="lede text-muted">{c.sub}</p>
            )}
          </div>
          <Magnetic>
            {soldOut ? (
              <Link href={`/waitlist?event=${next?.event.slug}`} className="btn btn-primary !bg-ivory !text-ink !border-ivory hover:!bg-bone">
                {copy.cta.waitlist}
              </Link>
            ) : (
              <Link href={href} className="btn btn-primary !bg-ivory !text-ink !border-ivory hover:!bg-bone">
                <span>{next && salesEnabled ? copy.cta.secureSeat : copy.cta.chooseEvening}</span>
                <span className="btn-arrow" aria-hidden="true">→</span>
              </Link>
            )}
          </Magnetic>
        </Reveal>
      </Container>
    </Section>
  );
}
