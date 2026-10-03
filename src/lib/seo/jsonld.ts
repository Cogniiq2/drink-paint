import { site } from "@/config/site";
import { siteUrl, DEFAULT_DESCRIPTION } from "./metadata";
import type { EventView } from "@/lib/events/queries";
import { schemaAvailability } from "@/lib/inventory/availability";

const base = () => siteUrl();

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${base()}/#organization`,
    name: site.brand.name,
    legalName: site.company.legalName,
    url: base(),
    logo: `${base()}/icon.svg`,
    sameAs: [site.social.instagramUrl],
    address: postalAddress(),
  };
}

function postalAddress() {
  return {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    postalCode: site.address.postalCode,
    addressLocality: site.address.city,
    addressCountry: site.address.country,
  };
}

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "EntertainmentBusiness"],
    "@id": `${base()}/#venue`,
    name: site.brand.name,
    description: DEFAULT_DESCRIPTION,
    url: base(),
    image: `${base()}${site.media.ogDefault}`,
    address: postalAddress(),
    geo: { "@type": "GeoCoordinates", latitude: site.address.geo.latitude, longitude: site.address.geo.longitude },
    parentOrganization: { "@id": `${base()}/#organization` },
    priceRange: "€€",
  };
}

export function eventJsonLd({ event, availability }: EventView) {
  const url = `${base()}/events/${event.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": `${url}#event`,
    name: `${event.title}${event.edition ? ` ${event.edition}` : ""} – ${site.brand.name}`,
    description: event.description,
    startDate: event.startsAt,
    endDate: event.endsAt,
    doorTime: event.doorsAt,
    eventStatus: event.status === "cancelled" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: [`${base()}${event.heroImagePath}`],
    url,
    location: {
      "@type": "Place",
      name: site.brand.name,
      address: postalAddress(),
    },
    organizer: { "@type": "Organization", name: site.company.legalName, url: base() },
    performer: { "@type": "Organization", name: site.brand.name },
    maximumAttendeeCapacity: event.capacity,
    remainingAttendeeCapacity: availability.remaining,
    ...(event.minimumAge ? { typicalAgeRange: `${event.minimumAge}-` } : {}),
    offers: {
      "@type": "Offer",
      url,
      price: (event.priceCents / 100).toFixed(2),
      priceCurrency: event.currency,
      availability: schemaAvailability(availability),
      validFrom: event.salesOpenAt ?? event.createdAt,
      ...(event.salesCloseAt ? { validThrough: event.salesCloseAt } : {}),
      inventoryLevel: { "@type": "QuantitativeValue", value: availability.remaining },
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${base()}${it.path}` })),
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
}
