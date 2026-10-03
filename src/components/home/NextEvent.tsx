import Link from "next/link";
import Image from "next/image";
import { site } from "@/config/site";
import { copy } from "@/content/de/copy";
import type { EventView } from "@/lib/events/queries";
import { formatDateLong, formatTime, formatWeekday } from "@/lib/format/date";
import { formatPrice } from "@/lib/format/money";
import { Container, Section, Eyebrow } from "@/components/ui/Section";
import { Reveal } from "@/components/motion/Reveal";
import { AvailabilityBadge } from "@/components/events/AvailabilityBadge";
import { DateBlock } from "@/components/events/DateBlock";

/** The next evening, composed like a gallery placard rather than a product card. */
export function NextEvent({ next, salesEnabled }: { next: EventView | null; salesEnabled: boolean }) {
  const t = copy.nextEvent;

  if (!next) {
    return (
      <Section surface="bone" id="next" labelledBy="next-title">
        <Container>
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h2 id="next-title" className="display-md mt-5 max-w-[16ch]">
            {t.noEvents}
          </h2>
          <p className="lede mt-5 text-muted max-w-[36ch]">{t.noEventsSub}</p>
          <Link href="/waitlist" className="btn btn-primary mt-8">
            {copy.cta.notify}
          </Link>
        </Container>
      </Section>
    );
  }

  const { event, availability } = next;
  const href = `/events/${event.slug}`;
  const soldOut = availability.state === "sold_out";
  const bookable = availability.bookable && salesEnabled;
  const rows: [string, string][] = [
    [t.doors, `${formatTime(event.doorsAt)} Uhr`],
    [t.start, `${formatTime(event.startsAt)} Uhr`],
    [t.end, `${formatTime(event.endsAt)} Uhr`],
    ["Ort", `${site.address.street}, ${site.address.city}`],
  ];

  return (
    <Section surface="bone" id="next" labelledBy="next-title">
      <Container>
        <Eyebrow>{t.eyebrow}</Eyebrow>
        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5 lg:order-2" scale>
            <Link href={href} className="block media-frame media-hover aspect-[4/5]">
              <Image src={event.heroImagePath} alt={event.heroImageAlt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" quality={74} />
            </Link>
          </Reveal>

          <Reveal as="div" className="lg:col-span-7 lg:order-1 flex flex-col" delay={80}>
            <div className="flex items-start gap-8 md:gap-12">
              <DateBlock iso={event.startsAt} />
              <div className="pt-1">
                {event.edition && <p className="eyebrow">{event.edition}</p>}
                <h2 id="next-title" className="display-md mt-2">
                  <Link href={href} className="hover:opacity-80 transition-opacity">
                    {event.title}
                  </Link>
                </h2>
                {event.subtitle && <p className="mt-2 text-muted">{event.subtitle}</p>}
                <p className="mt-4 text-sm">
                  {formatWeekday(event.startsAt)}, {formatDateLong(event.startsAt)}
                </p>
              </div>
            </div>

            <dl className="mt-10 hairline-t">
              {rows.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[7rem_1fr] md:grid-cols-[9rem_1fr] gap-4 py-3 hairline-b text-sm">
                  <dt className="text-muted">{k}</dt>
                  <dd className="tabular">{v}</dd>
                </div>
              ))}
              <div className="grid grid-cols-[7rem_1fr] md:grid-cols-[9rem_1fr] gap-4 py-3 hairline-b text-sm">
                <dt className="text-muted">{t.includedTitle}</dt>
                <dd>Leinwand, Farben, Pinsel, Schürze, Session, Welcome Drink</dd>
              </div>
              {event.minimumAge && (
                <div className="grid grid-cols-[7rem_1fr] md:grid-cols-[9rem_1fr] gap-4 py-3 hairline-b text-sm">
                  <dt className="text-muted">Alter</dt>
                  <dd>{t.age(event.minimumAge)}</dd>
                </div>
              )}
            </dl>

            <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="font-display text-3xl leading-none tabular">
                  {formatPrice(event.priceCents, event.currency)}
                  <span className="font-sans text-sm text-muted ml-2">{t.price}</span>
                </p>
                <p className="text-xs text-muted mt-1">{t.priceNote}</p>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-3">
                {soldOut ? (
                  <span className="eyebrow !text-wine">{t.soldOut}</span>
                ) : (
                  <AvailabilityBadge availability={availability} />
                )}
                {soldOut || availability.waitlist ? (
                  <Link href={`/waitlist?event=${event.slug}`} className="btn btn-primary" data-cta="waitlist">
                    {copy.cta.waitlist}
                  </Link>
                ) : bookable ? (
                  <Link href={href} className="btn btn-primary" data-cta="secure-seat">
                    <span>{copy.cta.secureSeat}</span>
                    <span className="btn-arrow" aria-hidden="true">→</span>
                  </Link>
                ) : (
                  <Link href={href} className="btn btn-outline">
                    {copy.cta.details}
                  </Link>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
