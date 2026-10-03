import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { impressum } from "@/content/de/legal/impressum";
import { resolveLegal } from "@/content/de/legal/placeholders";
import { getSiteSettings } from "@/lib/events/queries";
import { pageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMetadata({ title: "Impressum", description: "Anbieterkennzeichnung der BoLaGio GmbH, Betreiberin des BoLaGio Atelier in Bayreuth.", path: "/impressum", noIndex: true });

export default async function ImpressumPage() {
  const p = resolveLegal(await getSiteSettings());
  return <LegalPage eyebrow="Rechtliches" title="Impressum" sections={impressum(p)} />;
}
