import type { LegalPlaceholders } from "./placeholders";
import type { LegalSection } from "./impressum";

/**
 * Ticket terms skeleton. IMPORTANT: Freizeitveranstaltungen mit festem Termin
 * fallen unter § 312g Abs. 2 Nr. 9 BGB – das 14-tägige Widerrufsrecht gilt in
 * der Regel NICHT. Die endgültige Formulierung muss den tatsächlichen
 * Veranstaltungsvertrag und deutsches Recht abbilden. Keine Fristen erfinden.
 */
export function ticketbedingungen(p: LegalPlaceholders): LegalSection[] {
  return [
    { heading: "1. Veranstalter", paragraphs: [`${p.legalName}, ${p.street}, ${p.postalCity} (nachfolgend „Veranstalter“).`] },
    {
      heading: "2. Vertragsschluss",
      paragraphs: [
        "Mit Klick auf „Zahlungspflichtig buchen“ gibst du ein verbindliches Angebot zum Erwerb der ausgewählten Tickets ab. Der Vertrag kommt mit der Buchungsbestätigung per E-Mail zustande.",
      ],
    },
    {
      heading: "3. Leistung",
      paragraphs: [
        "Das Ticket berechtigt zur Teilnahme an der genannten Veranstaltung einschließlich Leinwand, Malmaterial, Schürze, angeleiteter Session und einem Welcome Drink. Das entstandene Bild geht in das Eigentum des Gastes über.",
      ],
    },
    { heading: "4. Preise", paragraphs: ["Alle Preise verstehen sich in Euro inklusive der gesetzlichen Umsatzsteuer. Es fallen keine zusätzlichen Buchungsgebühren an."] },
    {
      heading: "5. Widerrufsrecht",
      paragraphs: [
        "{{RECHTLICH ZU PRÜFEN: Bei Verträgen über Freizeitbetätigungen mit einem spezifischen Termin besteht gemäß § 312g Abs. 2 Nr. 9 BGB kein gesetzliches Widerrufsrecht. Die endgültige Belehrung ist durch Rechtsbeistand zu formulieren.}}",
      ],
    },
    { heading: "6. Stornierung und Übertragung", paragraphs: ["{{STORNIERUNGS- UND ÜBERTRAGUNGSREGELUNG – vom Veranstalter festzulegen. Keine Fristen ohne Freigabe eintragen.}}"] },
    {
      heading: "7. Absage oder Verlegung durch den Veranstalter",
      paragraphs: ["{{REGELUNG ZU ABSAGE/VERLEGUNG UND RÜCKERSTATTUNG – rechtlich zu prüfen.}}"],
    },
    {
      heading: "8. Mindestalter",
      paragraphs: ["Für Veranstaltungen mit Ausschank alkoholischer Getränke gilt das jeweils angegebene Mindestalter. Ein Altersnachweis ist vor Ort vorzuzeigen. Ohne Nachweis kann der Zutritt verweigert werden; ein Anspruch auf Rückerstattung besteht in diesem Fall {{REGELUNG}}."],
    },
    { heading: "9. Hausrecht", paragraphs: ["Der Veranstalter übt das Hausrecht aus. {{WEITERE REGELUNGEN}}"] },
    { heading: "10. Anwendbares Recht", paragraphs: ["Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts, soweit dem keine zwingenden verbraucherschützenden Vorschriften entgegenstehen."] },
    { heading: "Stand", paragraphs: ["{{DATUM}}"] },
  ];
}

/** Short summary shown in checkout. Must mirror the final terms. */
export const checkoutPolicySummary = {
  cancellation: "{{KURZE STORNIERUNGSINFO – wird mit den Ticketbedingungen festgelegt.}}",
  withdrawal: "Hinweis: Bei Veranstaltungen mit festem Termin besteht in der Regel kein gesetzliches Widerrufsrecht (§ 312g Abs. 2 Nr. 9 BGB). {{RECHTLICH ZU PRÜFEN}}",
};
