import type { LegalPlaceholders } from "./placeholders";
import type { LegalSection } from "./impressum";

/**
 * Structure for the privacy notice. The wording must be finalised by legal
 * counsel; the sections reflect what the site technically does.
 */
export function datenschutz(p: LegalPlaceholders): LegalSection[] {
  return [
    { heading: "Verantwortlicher", paragraphs: [`${p.legalName}, ${p.street}, ${p.postalCity}`, `E-Mail: ${p.email}`, `Datenschutzkontakt: ${p.dataProtectionContact}`] },
    {
      heading: "Hosting und Server-Logfiles",
      paragraphs: [
        "Diese Website wird bei {{HOSTING-ANBIETER, z. B. Vercel Inc.}} gehostet. Beim Aufruf werden technisch notwendige Daten (IP-Adresse, Zeitpunkt, aufgerufene Seite, Browser) verarbeitet, um die Website auszuliefern und abzusichern. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.",
      ],
    },
    {
      heading: "Ticketbuchung und Zahlung",
      paragraphs: [
        "Für die Buchung verarbeiten wir Vorname, Nachname, E-Mail-Adresse, die gewählte Veranstaltung und Ticketanzahl. Die Zahlung erfolgt über Stripe Payments Europe, Ltd. Wir erhalten keine vollständigen Zahlungsdaten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Buchungsdaten werden nach den gesetzlichen Aufbewahrungsfristen gespeichert.",
        "Datenbank und Speicherung: {{DATENBANK-ANBIETER, z. B. Supabase Inc., Serverstandort EU}}.",
      ],
    },
    {
      heading: "Transaktionale E-Mails",
      paragraphs: ["Buchungsbestätigungen, Erinnerungen und Änderungen versenden wir über {{E-MAIL-DIENSTLEISTER, z. B. Resend}}. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO."],
    },
    {
      heading: "Warteliste und Anfragen",
      paragraphs: ["Trägst du dich in eine Warteliste ein oder stellst eine Anfrage für einen privaten Abend, verarbeiten wir die angegebenen Daten zur Bearbeitung deines Anliegens (Art. 6 Abs. 1 lit. b bzw. f DSGVO)."],
    },
    {
      heading: "Newsletter",
      paragraphs: ["Nur mit deiner ausdrücklichen, separaten Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) informieren wir dich über neue Abende. Du kannst dich jederzeit abmelden."],
    },
    {
      heading: "Cookies und Analyse",
      paragraphs: [
        "Die Website verwendet ausschließlich technisch notwendige Speicherung (z. B. Admin-Sitzung, gespeicherte Einwilligung). Analyse- oder Marketing-Dienste werden erst nach deiner Einwilligung geladen. {{BEI AKTIVIERUNG: eingesetzte Dienste, Anbieter, Zweck, Speicherdauer ergänzen.}}",
      ],
    },
    {
      heading: "Externe Links",
      paragraphs: ["Links zu Instagram und Kartendiensten führen zu Angeboten Dritter. Beim Klick gelten deren Datenschutzbestimmungen. Es werden keine Inhalte dieser Anbieter automatisch eingebettet."],
    },
    {
      heading: "Deine Rechte",
      paragraphs: ["Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das Recht, dich bei einer Aufsichtsbehörde zu beschweren."],
    },
    { heading: "Stand", paragraphs: ["{{DATUM DER LETZTEN AKTUALISIERUNG}}"] },
  ];
}
