import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { datenschutz } from "@/content/de/legal/datenschutz";
import { resolveLegal } from "@/content/de/legal/placeholders";
import { getSiteSettings } from "@/lib/events/queries";
import { pageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMetadata({ title: "Datenschutz", description: "Datenschutzerklärung des BoLaGio Atelier Bayreuth.", path: "/datenschutz", noIndex: true });

export default async function DatenschutzPage() {
  const p = resolveLegal(await getSiteSettings());
  return <LegalPage eyebrow="Rechtliches" title="Datenschutz" intro="Diese Erklärung beschreibt, welche Daten beim Besuch der Website und bei einer Buchung verarbeitet werden. Markierte Stellen sind vor Veröffentlichung zu ergänzen und rechtlich zu prüfen." sections={datenschutz(p)} />;
}
