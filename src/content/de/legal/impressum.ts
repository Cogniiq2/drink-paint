import type { LegalPlaceholders } from "./placeholders";

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export function impressum(p: LegalPlaceholders): LegalSection[] {
  return [
    { heading: "Angaben gemäß § 5 DDG", paragraphs: [p.legalName, `${p.street}`, `${p.postalCity}`, `Sitz der Gesellschaft: ${p.registeredOffice}`] },
    { heading: "Vertreten durch", paragraphs: [`Geschäftsführung: ${p.managingDirectors}`] },
    { heading: "Kontakt", paragraphs: [`E-Mail: ${p.email}`, `Telefon: ${p.phone}`] },
    { heading: "Registereintrag", paragraphs: [`Registergericht: ${p.registerCourt}`, `Registernummer: ${p.registerNumber}`] },
    { heading: "Umsatzsteuer-Identifikationsnummer", paragraphs: [`USt-IdNr. gemäß § 27a UStG: ${p.vatId}`] },
    { heading: "Aufsichtsbehörde", paragraphs: [p.supervisoryAuthority] },
    { heading: "Verantwortlich für den Inhalt", paragraphs: [p.responsibleForContent] },
    {
      heading: "Verbraucherstreitbeilegung",
      paragraphs: [
        "{{HINWEIS ZUR TEILNAHME AN VERBRAUCHERSCHLICHTUNGSVERFAHREN NACH § 36 VSBG – vom Rechtsbeistand zu bestätigen.}}",
      ],
    },
  ];
}
