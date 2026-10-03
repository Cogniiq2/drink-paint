import { site } from "@/config/site";
import { siteUrl } from "@/lib/seo/metadata";
import type { EventRecord } from "@/lib/data/types";

const fmt = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const escapeText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const fold = (line: string) => {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 73) {
    out.push(rest.slice(0, 73));
    rest = " " + rest.slice(73);
  }
  out.push(rest);
  return out.join("\r\n");
};

/** RFC 5545 VEVENT. Doors time is the DTSTART so guests arrive on time. */
export function buildIcs(ev: EventRecord): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${site.company.legalName}//${site.brand.name}//DE`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${ev.id}@${new URL(siteUrl()).hostname}`,
    `DTSTAMP:${fmt(new Date().toISOString())}`,
    `DTSTART:${fmt(ev.doorsAt)}`,
    `DTEND:${fmt(ev.endsAt)}`,
    `SUMMARY:${escapeText(`${ev.title} · ${site.brand.name}`)}`,
    `DESCRIPTION:${escapeText(`Einlass ab ${new Date(ev.doorsAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: site.locale.timeZone })} Uhr. ${ev.description}\n${siteUrl()}/events/${ev.slug}`)}`,
    `LOCATION:${escapeText(`${site.brand.name}, ${site.address.street}, ${site.address.postalCode} ${site.address.city}`)}`,
    `URL:${siteUrl()}/events/${ev.slug}`,
    `GEO:${site.address.geo.latitude};${site.address.geo.longitude}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT24H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(`Morgen: ${ev.title}`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
