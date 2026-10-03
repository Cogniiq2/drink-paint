import { site } from "@/config/site";

export interface FaqItem {
  id: string;
  q: string;
  a: string;
  /** Policy-dependent answers are flagged so they can be overridden from site_settings (key: faq.<id>). */
  policy?: boolean;
}

export const faq: FaqItem[] = [
  { id: "experience", q: "Muss ich malen können?", a: "Nein. Das Motiv des Abends wird Schritt für Schritt angeleitet, und wer hängt, bekommt Hilfe. Die meisten Gäste halten zum ersten Mal seit der Schule einen Pinsel in der Hand." },
  { id: "included", q: "Was ist im Ticket enthalten?", a: "Leinwand, Staffelei, Farben, Pinsel, Schürze, die geführte Session und ein Welcome Drink. Dein fertiges Bild nimmst du mit nach Hause." },
  { id: "dress", q: "Was soll ich anziehen?", a: "Was du magst. Du bekommst eine Schürze, Acrylfarbe lässt sich aus den meisten Stoffen aber nur schwer entfernen. Lieblingsstücke besser zu Hause lassen." },
  { id: "duration", q: "Wie lange dauert ein Abend?", a: "Rund drei Stunden. Einlass ist eine halbe Stunde vor Beginn, die genauen Zeiten stehen bei jedem Abend." },
  { id: "age", q: "Gibt es ein Mindestalter?", a: `Unsere öffentlichen Abende sind in der Regel ab ${site.ticketing.defaultMinimumAge} Jahren, weil Alkohol ausgeschenkt wird. Das Mindestalter steht bei jedem Abend dabei und wird vor Ort kontrolliert.` },
  { id: "alone", q: "Kann ich alleine kommen?", a: "Unbedingt. Der lange Tisch macht es leicht, ins Gespräch zu kommen. Viele Gäste kommen allein und gehen zu mehreren." },
  { id: "together", q: "Können wir zusammensitzen?", a: "Ja. Wenn ihr in einer Buchung bestellt, sitzt ihr nebeneinander. Bei getrennten Buchungen schreib uns kurz die Namen, wir kümmern uns darum." },
  { id: "soldout", q: "Was passiert, wenn ein Abend ausverkauft ist?", a: "Trag dich in die Warteliste ein. Wird ein Platz frei oder öffnen wir einen weiteren Termin, bekommst du als Erstes eine E-Mail." },
  { id: "transfer", q: "Kann ich mein Ticket übertragen?", a: "{{TRANSFER_POLICY}}", policy: true },
  { id: "cancel", q: "Kann ich stornieren?", a: "{{CANCELLATION_POLICY}}", policy: true },
  { id: "private", q: "Kann ich einen privaten Abend buchen?", a: "Ja. Für Geburtstage, JGAs, Teams oder einfach eure Gruppe öffnen wir das Atelier exklusiv. Schreib uns über die Seite Private Events, wir melden uns mit einem Vorschlag." },
  { id: "location", q: "Wo findet es statt?", a: `${site.address.street}, ${site.address.postalCode} ${site.address.city} – mitten in der Innenstadt, wenige Schritte von der Fußgängerzone.` },
  { id: "drinks", q: "Gibt es weitere Getränke?", a: "Ja. Ein Welcome Drink ist im Ticket enthalten, weitere Getränke – mit und ohne Alkohol – gibt es vor Ort an der Bar." },
];

/** Placeholder text shown until a real policy is configured. Never invents deadlines. */
export const policyPlaceholders: Record<string, string> = {
  "{{TRANSFER_POLICY}}": "Die Regelung zur Übertragung von Tickets wird vor dem Verkaufsstart in den Ticketbedingungen festgelegt.",
  "{{CANCELLATION_POLICY}}": "Die Stornierungsregelung wird vor dem Verkaufsstart in den Ticketbedingungen festgelegt und hier veröffentlicht.",
};

export function resolveFaq(items: FaqItem[], overrides: Record<string, unknown>): FaqItem[] {
  return items.map((item) => {
    const override = overrides[`faq.${item.id}`];
    let a = typeof override === "string" && override.trim() ? override : item.a;
    for (const [token, text] of Object.entries(policyPlaceholders)) a = a.replaceAll(token, text);
    return { ...item, a };
  });
}
