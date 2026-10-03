import { site } from "@/config/site";
import { siteUrl } from "@/lib/seo/metadata";
import type { EventRecord, OrderRecord, PrivateInquiry, TicketRecord, WaitlistEntry } from "@/lib/data/types";
import { formatDateLong, formatTime, formatWeekday } from "@/lib/format/date";
import { formatMoney } from "@/lib/format/money";
import { emailLayout, esc, row, table, button, p } from "./layout";

const venue = () => `${site.address.street}, ${site.address.postalCode} ${site.address.city}`;
const when = (ev: EventRecord) => `${formatWeekday(ev.startsAt)}, ${formatDateLong(ev.startsAt)}`;
const eventUrl = (ev: EventRecord) => `${siteUrl()}/events/${ev.slug}`;

export interface Rendered {
  subject: string;
  html: string;
  text: string;
}

export function purchaseConfirmation(order: OrderRecord, ev: EventRecord, tickets: TicketRecord[], qrDataUrls: string[]): Rendered {
  const subject = `Dein Platz ist reserviert · ${ev.title} · ${formatDateLong(ev.startsAt)}`;
  const ticketsHtml = tickets
    .map(
      (t, i) => `<div style="margin:12px 0;padding:12px;border:1px solid rgba(22,20,17,0.12);">
      <div style="font-size:12px;color:#6d655a;">Ticket ${i + 1} von ${tickets.length}</div>
      <div style="font-family:monospace;font-size:16px;margin:4px 0 8px;">${esc(t.code)}</div>
      ${qrDataUrls[i] ? `<img src="${qrDataUrls[i]}" width="140" height="140" alt="QR-Code ${esc(t.code)}" style="display:block;">` : ""}
    </div>`,
    )
    .join("");
  const bodyHtml =
    p(`Hallo ${esc(order.firstName)}, schön, dass du kommst.`) +
    table(
      row("Abend", `<strong>${esc(ev.title)}${ev.edition ? ` ${esc(ev.edition)}` : ""}</strong>`) +
        row("Datum", esc(when(ev))) +
        row("Einlass", `${formatTime(ev.doorsAt)} Uhr · Beginn ${formatTime(ev.startsAt)} Uhr`) +
        row("Ort", esc(venue())) +
        row("Tickets", `${order.quantity}`) +
        row("Gesamt", `${formatMoney(order.totalCents, order.currency)} inkl. MwSt.`) +
        row("Referenz", `<span style="font-family:monospace;">${esc(order.orderNumber)}</span>`),
    ) +
    (ev.minimumAge ? p(`Teilnahme ab ${ev.minimumAge} Jahren. Bitte bring einen Ausweis mit.`) : "") +
    p("Leinwand, Farben, Pinsel, Schürze und dein Welcome Drink stehen bereit. Du musst nichts mitbringen.") +
    ticketsHtml +
    `<p style="margin:20px 0 0;">${button(`${siteUrl()}/api/events/${ev.slug}/calendar.ics`, "Zum Kalender hinzufügen")} &nbsp; ${button(site.address.mapsUrl, "Route öffnen")}</p>`;
  const text = [
    `Hallo ${order.firstName}, dein Platz ist reserviert.`,
    ``,
    `${ev.title}${ev.edition ? ` ${ev.edition}` : ""}`,
    when(ev),
    `Einlass ${formatTime(ev.doorsAt)} Uhr, Beginn ${formatTime(ev.startsAt)} Uhr`,
    venue(),
    `Tickets: ${order.quantity} · Gesamt: ${formatMoney(order.totalCents, order.currency)} inkl. MwSt.`,
    `Referenz: ${order.orderNumber}`,
    ``,
    ...tickets.map((t, i) => `Ticket ${i + 1}: ${t.code}`),
    ``,
    `Kalender: ${siteUrl()}/api/events/${ev.slug}/calendar.ics`,
    `Route: ${site.address.mapsUrl}`,
  ].join("\n");
  return { subject, html: emailLayout({ preheader: `${ev.title} · ${when(ev)}`, headline: "Dein Platz ist reserviert.", bodyHtml }), text };
}

export function eventReminder(order: OrderRecord, ev: EventRecord): Rendered {
  const subject = `Morgen: ${ev.title} · Einlass ${formatTime(ev.doorsAt)} Uhr`;
  const bodyHtml =
    p(`Hallo ${esc(order.firstName)}, kurz zur Erinnerung: wir sehen uns ${esc(when(ev))}.`) +
    table(row("Einlass", `${formatTime(ev.doorsAt)} Uhr`) + row("Beginn", `${formatTime(ev.startsAt)} Uhr`) + row("Ort", esc(venue())) + row("Tickets", `${order.quantity}`)) +
    p("Zieh etwas an, das Farbe abbekommen darf. Alles andere liegt bereit.") +
    `<p>${button(site.address.mapsUrl, "Route öffnen")}</p>`;
  return { subject, html: emailLayout({ preheader: subject, headline: "Bis morgen.", bodyHtml }), text: `${subject}\n${when(ev)}\nEinlass ${formatTime(ev.doorsAt)} Uhr\n${venue()}` };
}

export function eventChanged(order: OrderRecord, ev: EventRecord, note: string): Rendered {
  const subject = `Änderung: ${ev.title} · ${formatDateLong(ev.startsAt)}`;
  const bodyHtml = p(`Hallo ${esc(order.firstName)}, es gibt eine Änderung zu deinem Abend.`) + p(esc(note)) + table(row("Neuer Termin", esc(when(ev))) + row("Einlass", `${formatTime(ev.doorsAt)} Uhr`) + row("Ort", esc(venue()))) + `<p>${button(eventUrl(ev), "Details ansehen")}</p>`;
  return { subject, html: emailLayout({ preheader: subject, headline: "Eine Änderung.", bodyHtml }), text: `${subject}\n\n${note}\n\n${when(ev)}, Einlass ${formatTime(ev.doorsAt)} Uhr` };
}

export function eventCancelled(order: OrderRecord, ev: EventRecord, note: string): Rendered {
  const subject = `Abgesagt: ${ev.title} · ${formatDateLong(ev.startsAt)}`;
  const bodyHtml = p(`Hallo ${esc(order.firstName)}, leider müssen wir diesen Abend absagen.`) + p(esc(note)) + p(`Referenz: <span style="font-family:monospace;">${esc(order.orderNumber)}</span>. Wir melden uns zur Erstattung oder einem Ersatztermin persönlich bei dir.`);
  return { subject, html: emailLayout({ preheader: subject, headline: "Das tut uns leid.", bodyHtml }), text: `${subject}\n\n${note}\n\nReferenz: ${order.orderNumber}` };
}

export function refundConfirmation(order: OrderRecord, ev: EventRecord): Rendered {
  const subject = `Erstattung · ${order.orderNumber}`;
  const bodyHtml = p(`Hallo ${esc(order.firstName)}, wir haben ${formatMoney(order.totalCents, order.currency)} für ${esc(ev.title)} erstattet.`) + p("Je nach Bank dauert es ein paar Werktage, bis der Betrag sichtbar ist.");
  return { subject, html: emailLayout({ preheader: subject, headline: "Erstattet.", bodyHtml }), text: `${subject}\n\n${formatMoney(order.totalCents, order.currency)} für ${ev.title} wurden erstattet.` };
}

export function waitlistOpening(entry: WaitlistEntry, ev: EventRecord, remaining: number): Rendered {
  const subject = `Plätze frei: ${ev.title} · ${formatDateLong(ev.startsAt)}`;
  const bodyHtml = p(`Hallo ${esc(entry.name)}, es ist wieder Platz am Tisch.`) + table(row("Abend", esc(ev.title)) + row("Datum", esc(when(ev))) + row("Frei", `${remaining} ${remaining === 1 ? "Platz" : "Plätze"}`)) + p("Wer zuerst bucht, sitzt. Wir können keinen Platz zurückhalten.") + `<p>${button(eventUrl(ev), "Platz sichern")}</p>`;
  return { subject, html: emailLayout({ preheader: subject, headline: "Es ist wieder Platz.", bodyHtml }), text: `${subject}\n\n${when(ev)}\n${remaining} frei\n${eventUrl(ev)}` };
}

export function waitlistJoined(entry: WaitlistEntry, ev: EventRecord | null): Rendered {
  const subject = ev ? `Warteliste: ${ev.title}` : "Du stehst auf der Liste";
  const bodyHtml = p(`Hallo ${esc(entry.name)}, du stehst auf der Warteliste${ev ? ` für ${esc(ev.title)} am ${esc(formatDateLong(ev.startsAt))}` : ""}.`) + p("Wird ein Platz frei oder öffnet ein neuer Abend, bekommst du eine E-Mail. Keine Zahlung, keine Verpflichtung.");
  return { subject, html: emailLayout({ preheader: subject, headline: "Notiert.", bodyHtml }), text: `${subject}\n\nWir melden uns, sobald ein Platz frei wird.` };
}

export function inquiryReceipt(q: PrivateInquiry): Rendered {
  const subject = "Deine Anfrage ist angekommen";
  const bodyHtml = p(`Hallo ${esc(q.name)}, danke für deine Anfrage für ${esc(q.eventType)} mit etwa ${q.guests} Gästen.`) + p("Wir melden uns innerhalb von zwei Werktagen mit einem Vorschlag.") + (q.preferredDate ? table(row("Wunschtermin", esc(q.preferredDate)) + (q.alternativeDate ? row("Alternativ", esc(q.alternativeDate)) : "")) : "");
  return { subject, html: emailLayout({ preheader: subject, headline: "Danke.", bodyHtml }), text: `${subject}\n\nWir melden uns innerhalb von zwei Werktagen.` };
}

export function inquiryNotification(q: PrivateInquiry): Rendered {
  const subject = `Neue Anfrage: ${q.eventType} · ${q.guests} Gäste · ${q.name}`;
  const bodyHtml = table(
    row("Name", esc(q.name)) + row("E-Mail", `<a href="mailto:${esc(q.email)}">${esc(q.email)}</a>`) + row("Telefon", esc(q.phone ?? "–")) + row("Art", esc(q.eventType)) + row("Gäste", `${q.guests}`) + row("Wunschtermin", esc(q.preferredDate ?? "–")) + row("Alternativ", esc(q.alternativeDate ?? "–")),
  ) + p(esc(q.message).replace(/\n/g, "<br>"));
  const text = `${subject}\n\n${q.name}\n${q.email}\n${q.phone ?? ""}\n${q.eventType}, ${q.guests} Gäste\n${q.preferredDate ?? ""} / ${q.alternativeDate ?? ""}\n\n${q.message}`;
  return { subject, html: emailLayout({ preheader: subject, headline: "Neue Anfrage.", bodyHtml }), text };
}

export function orderRequiresReview(order: OrderRecord, ev: EventRecord): Rendered {
  const subject = `⚠︎ Bestellung prüfen: ${order.orderNumber} · ${ev.title}`;
  const bodyHtml = p(`Die Zahlung für ${esc(order.orderNumber)} ist eingegangen, aber die Plätze waren nach Ablauf der Reservierung nicht mehr verfügbar.`) + table(row("Gast", `${esc(order.firstName)} ${esc(order.lastName)} · ${esc(order.email)}`) + row("Tickets", `${order.quantity}`) + row("Betrag", formatMoney(order.totalCents, order.currency))) + p("Bitte im Admin prüfen und ggf. über das Stripe-Dashboard erstatten.");
  return { subject, html: emailLayout({ preheader: subject, headline: "Bitte prüfen.", bodyHtml }), text: `${subject}\n\n${order.firstName} ${order.lastName} ${order.email}\n${order.quantity} Tickets, ${formatMoney(order.totalCents, order.currency)}` };
}
