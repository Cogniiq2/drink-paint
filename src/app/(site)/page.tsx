import { Nav } from "@/components/layout/Nav";
import { MobileBookingBar } from "@/components/layout/MobileBookingBar";
import { Hero } from "@/components/home/Hero";
import { Proposition } from "@/components/home/Proposition";
import { NextEvent } from "@/components/home/NextEvent";
import { Gallery } from "@/components/home/Gallery";
import { Inclusions } from "@/components/home/Inclusions";
import { Evening } from "@/components/home/Evening";
import { UpcomingNights } from "@/components/home/UpcomingNights";
import { PrivateNights } from "@/components/home/PrivateNights";
import { SocialProof } from "@/components/home/SocialProof";
import { InstagramGrid } from "@/components/home/InstagramGrid";
import { Location } from "@/components/home/Location";
import { FaqSection } from "@/components/home/FaqSection";
import { FinalCta } from "@/components/home/FinalCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { TrackOnMount } from "@/components/analytics/TrackOnMount";
import { getUpcomingEvents, isSalesEnabled, getSiteSettings } from "@/lib/events/queries";
import { getStore } from "@/lib/data";
import { env } from "@/config/env";
import { faq, resolveFaq } from "@/content/de/faq";
import { copy } from "@/content/de/copy";
import { organizationJsonLd, localBusinessJsonLd, eventJsonLd } from "@/lib/seo/jsonld";
import { heroAvailabilityLine } from "@/lib/inventory/availability";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [upcoming, salesEnabled, settings] = await Promise.all([getUpcomingEvents(5), isSalesEnabled(), getSiteSettings()]);
  const next = upcoming.find((v) => v.availability.bookable) ?? upcoming[0] ?? null;
  const testimonials = env().TESTIMONIALS_ENABLED ? await getStore().listPublishedTestimonials() : null;
  const faqItems = resolveFaq(faq, settings).slice(0, 6);

  return (
    <>
      <Nav overHero ctaHref={next ? `/events/${next.event.slug}` : "/events"} />
      <main id="main">
        <JsonLd data={[organizationJsonLd(), localBusinessJsonLd(), ...upcoming.map((v) => eventJsonLd(v))]} />
        <TrackOnMount event={{ name: "homepage_view" }} />
        <Hero next={next} />
        <Proposition />
        <NextEvent next={next} salesEnabled={salesEnabled} />
        <Gallery />
        <Inclusions next={next} />
        <Evening />
        <UpcomingNights events={upcoming} />
        <PrivateNights />
        {testimonials && <SocialProof testimonials={testimonials} />}
        <InstagramGrid />
        <Location />
        <FaqSection items={faqItems} compact />
        <FinalCta next={next} salesEnabled={salesEnabled} />
      </main>
      <MobileBookingBar
        href={next ? `/events/${next.event.slug}` : "/events"}
        label={copy.nav.mobileSticky}
        detail={next ? heroAvailabilityLine(next.availability) : null}
      />
    </>
  );
}
