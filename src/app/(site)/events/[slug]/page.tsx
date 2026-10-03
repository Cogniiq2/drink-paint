import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/layout/Nav";
import { Container, Section, Eyebrow } from "@/components/ui/Section";
import { JsonLd } from "@/components/seo/JsonLd";
import { TrackOnMount } from "@/components/analytics/TrackOnMount";
import { PurchaseModule } from "@/components/events/PurchaseModule";
import { ShareButton } from "@/components/events/ShareButton";
import { DateBlock } from "@/components/events/DateBlock";
import { Accordion } from "@/components/ui/Accordion";
import { MobileEventBar } from "@/components/events/MobileEventBar";
import { getEventBySlug, isSalesEnabled, getSiteSettings } from "@/lib/events/queries";
import { formatDateLong, formatTime, formatWeekday } from "@/lib/format/date";
import { formatPrice } from "@/lib/format/money";
import { breadcrumbJsonLd, eventJsonLd } from "@/lib/seo/jsonld";
import { site } from "@/config/site";
import { copy } from "@/content/de/copy";
import { faq, resolveFaq } from "@/content/de/faq";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const view = await getEventBySlug(slug);
  if (!view) return { title: "Abend nicht gefunden", robots: { index: false } };
  const { event, availability } = view;
  const title = `${event.title}${event.edition ? ` ${event.edition}` : ""} · ${formatDateLong(event.startsAt)}`;
  const description = `Paint & Drink in Bayreuth am ${formatWeekday(event.startsAt)}, ${formatDateLong(event.startsAt)}, ${formatTime(event.startsAt)} Uhr. ${formatPrice(event.priceCents, event.currency)} pro Person, Leinwand und Welcome Drink inklusive. ${availability.state === "sold_out" ? "Ausverkauft – Warteliste offen." : availability.label + "."}`;
  return {
    title,
    description,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: { title: `${title} · ${site.brand.name}`, description, url: `/events/${event.slug}`, type: "website" },
  };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const [view, salesEnabled, settings] = await Promise.all([getEventBySlug(slug), isSalesEnabled(), getSiteSettings()]);
  if (!view) notFound();
  const { event, availability } = view;
  const t = copy.event;
  const faqItems = resolveFaq(faq, settings).filter((f) => ["experience", "dress", "duration", "together", "transfer", "cancel"].includes(f.id));

  return (
    <>
      <Nav ctaHref="#buchen" />
      <main id="main" className="pt-16 md:pt-[4.5rem]">
        <JsonLd data={[eventJsonLd(view), breadcrumbJsonLd([{ name: t.breadcrumbHome, path: "/" }, { name: t.breadcrumbEvents, path: "/events" }, { name: event.title, path: `/events/${event.slug}` }])]} />
        <TrackOnMount event={{ name: "event_view", props: { slug: event.slug, state: availability.state } }} />

        <Section surface="ivory" size="sm" className="!pb-8">
          <Container>
            <nav aria-label="Brotkrumen" className="text-sm text-muted">
              <ol className="flex gap-2">
                <li><Link href="/" className="hover:text-text">{t.breadcrumbHome}</Link></li>
                <li aria-hidden="true">/</li>
                <li><Link href="/events" className="hover:text-text">{t.breadcrumbEvents}</Link></li>
              </ol>
            </nav>
            <div className="mt-10 flex items-start gap-8 md:gap-14">
              <DateBlock iso={event.startsAt} />
              <div className="pt-1 min-w-0">
                {event.edition && <Eyebrow>{event.edition}</Eyebrow>}
                <h1 className="display-lg mt-2">{event.title}</h1>
                {event.subtitle && <p className="mt-3 text-muted lede">{event.subtitle}</p>}
                <p className="mt-5">
                  {formatWeekday(event.startsAt)}, {formatDateLong(event.startsAt)} · {formatTime(event.startsAt)}–{formatTime(event.endsAt)} Uhr
                </p>
              </div>
            </div>
          </Container>
        </Section>

        <Container wide>
          <figure className="media-frame aspect-[16/10] md:aspect-[21/9]">
            <Image src={event.heroImagePath} alt={event.heroImageAlt} fill priority sizes="100vw" quality={74} className="object-cover" />
          </figure>
        </Container>

        <Section surface="ivory" size="sm">
          <Container>
            <div className="grid gap-14 lg:grid-cols-12">
              <div className="lg:col-span-7 order-2 lg:order-1">
                <dl className="hairline-t">
                  {[
                    [t.doors, `${formatTime(event.doorsAt)} Uhr`],
                    [t.time, `${formatTime(event.startsAt)}–${formatTime(event.endsAt)} Uhr`],
                    [t.place, `${site.address.street}, ${site.address.postalCode} ${site.address.city}`],
                    [t.price, `${formatPrice(event.priceCents, event.currency)} ${t.perPerson} · ${t.priceVat}`],
                    [t.seats, `${event.capacity} ${t.seats}`],
                    ...(event.minimumAge ? [[t.age, t.ageLine(event.minimumAge)]] : []),
                  ].map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[6rem_1fr] md:grid-cols-[9rem_1fr] gap-4 py-3 hairline-b text-sm">
                      <dt className="text-muted">{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>

                <h2 className="display-sm mt-14">{t.about}</h2>
                <div className="mt-5 lede max-w-[52ch] text-muted space-y-4" style={{ textWrap: "pretty" }}>
                  {event.description.split(/\n\n+/).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>

                <h2 className="display-sm mt-14">{t.included}</h2>
                <ul className="mt-5 grid sm:grid-cols-2 gap-x-8">
                  {copy.inclusions.items.map((it) => (
                    <li key={it.title} className="py-3 hairline-b">
                      <span className="font-display text-xl">{it.title}</span>
                      <span className="block text-sm text-muted mt-0.5">{it.text}</span>
                    </li>
                  ))}
                </ul>

                <h2 className="display-sm mt-14">{t.policiesTitle}</h2>
                <div className="mt-5">
                  <Accordion items={faqItems} />
                </div>
                <p className="mt-8 text-sm text-muted max-w-[52ch]">
                  {t.accessibility}{" "}
                  <Link href="/contact" className="underline hover:text-text">
                    Kontakt
                  </Link>
                </p>
                <div className="mt-8">
                  <ShareButton title={`${event.title} · ${site.brand.name}`} text={`${formatWeekday(event.startsAt)}, ${formatDateLong(event.startsAt)} – Paint & Drink in Bayreuth`} path={`/events/${event.slug}`} />
                </div>
              </div>

              <aside className="lg:col-span-4 lg:col-start-9 order-1 lg:order-2" id="buchen">
                <div className="lg:sticky lg:top-28">
                  <PurchaseModule
                    slug={event.slug}
                    title={event.title}
                    priceCents={event.priceCents}
                    currency={event.currency}
                    maxPerOrder={event.maxTicketsPerOrder}
                    minimumAge={event.minimumAge}
                    initial={{ state: availability.state, remaining: availability.remaining, capacity: availability.capacity, label: availability.label, bookable: availability.bookable && salesEnabled, waitlist: availability.waitlist, maxPerOrder: Math.min(event.maxTicketsPerOrder, availability.remaining) }}
                    salesEnabled={salesEnabled}
                  />
                </div>
              </aside>
            </div>
          </Container>
        </Section>
      </main>
      <MobileEventBar priceCents={event.priceCents} currency={event.currency} label={availability.state === "sold_out" ? copy.cta.waitlist : availability.bookable && salesEnabled ? copy.cta.secureSeat : copy.cta.details} href={availability.state === "sold_out" ? `/waitlist?event=${event.slug}` : "#buchen"} />
    </>
  );
}
