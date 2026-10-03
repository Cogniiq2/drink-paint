import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { ticketbedingungen } from "@/content/de/legal/ticketbedingungen";
import { resolveLegal } from "@/content/de/legal/placeholders";
import { getSiteSettings } from "@/lib/events/queries";
import { pageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMetadata({ title: "Ticketbedingungen", description: "Ticket- und Teilnahmebedingungen für Abende im BoLaGio Atelier Bayreuth.", path: "/ticketbedingungen", noIndex: true });

export default async function TermsPage() {
  const p = resolveLegal(await getSiteSettings());
  return <LegalPage eyebrow="Rechtliches" title="Ticketbedingungen" intro="Allgemeine Geschäfts- und Teilnahmebedingungen für den Erwerb von Tickets. Markierte Abschnitte sind Platzhalter: Die endgültige Fassung muss den tatsächlichen Veranstaltungsvertrag und deutsches Recht abbilden." sections={ticketbedingungen(p)} />;
}
