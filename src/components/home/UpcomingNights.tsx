import Link from "next/link";
import Image from "next/image";
import { copy } from "@/content/de/copy";
import type { EventView } from "@/lib/events/queries";
import { formatDay, formatMonthShort, formatTimeRange, formatWeekdayShort } from "@/lib/format/date";
import { formatPrice } from "@/lib/format/money";
import { Container, Section, Eyebrow } from "@/components/ui/Section";
import { Reveal } from "@/components/motion/Reveal";
import { AvailabilityBadge } from "@/components/events/AvailabilityBadge";

/** Programme rows, like a gallery calendar. Never more than a handful. */
export function UpcomingNights({ events, headline = true }: { events: EventView[]; headline?: boolean }) {
  const u = copy.upcoming;
  return (
    <Section surface="ivory" id="abende" labelledBy="upcoming-title">
      <Container>
        {headline && (
          <div className="grid gap-6 md:grid-cols-12 md:items-end mb-12 md:mb-16">
            <div className="md:col-span-7">
              <Eyebrow>{u.eyebrow}</Eyebrow>
              <h2 id="upcoming-title" className="display-md mt-4">
                {u.headline}
              </h2>
            </div>
            <p className="md:col-span-4 md:col-start-9 text-muted">{u.sub}</p>
          </div>
        )}

        {events.length === 0 ? (
          <div className="hairline-t pt-10">
            <p className="font-display text-3xl">{u.empty}</p>
            <p className="mt-3 text-muted max-w-[40ch]">{u.emptySub}</p>
            <Link href="/waitlist" className="btn btn-primary mt-8">
              {copy.cta.notify}
            </Link>
          </div>
        ) : (
          <ol className="hairline-t">
            {events.map(({ event, availability }, i) => {
              const soldOut = availability.state === "sold_out";
              return (
                <Reveal as="li" key={event.id} delay={i * 40} className="hairline-b">
                  <Link href={`/events/${event.slug}`} className="group grid grid-cols-[4.5rem_1fr_auto] md:grid-cols-[6rem_6rem_1fr_9rem_12rem_3rem] items-center gap-x-4 md:gap-x-8 py-5 md:py-6 transition-colors">
                    <span className="flex flex-col leading-none">
                      <span className="eyebrow">{formatWeekdayShort(event.startsAt)}</span>
                      <span className="font-display text-4xl tabular mt-1">{formatDay(event.startsAt)}</span>
                      <span className="eyebrow mt-1">{formatMonthShort(event.startsAt)}</span>
                    </span>
                    <span className="hidden md:block media-frame aspect-square w-24 media-hover">
                      <Image src={event.heroImagePath} alt="" fill sizes="96px" className="object-cover" quality={60} />
                    </span>
                    <span className="min-w-0">
                      {event.edition && <span className="eyebrow block">{event.edition}</span>}
                      <span className="font-display text-2xl md:text-3xl leading-tight block group-hover:italic transition-[font-style]">{event.title}</span>
                      <span className="text-sm text-muted block mt-1 md:hidden">
                        {formatTimeRange(event.startsAt, event.endsAt)} · {formatPrice(event.priceCents, event.currency)}
                      </span>
                      <span className="mt-2 md:hidden">
                        <AvailabilityBadge availability={availability} className={soldOut ? "text-muted" : ""} />
                      </span>
                    </span>
                    <span className="hidden md:block text-sm tabular text-muted">{formatTimeRange(event.startsAt, event.endsAt)}</span>
                    <span className="hidden md:flex flex-col gap-1 text-sm">
                      <span className="tabular">{formatPrice(event.priceCents, event.currency)}</span>
                      <AvailabilityBadge availability={availability} className={soldOut ? "text-muted" : ""} />
                    </span>
                    <span aria-hidden="true" className="justify-self-end text-xl transition-transform duration-300 ease-out group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </ol>
        )}
      </Container>
    </Section>
  );
}
