import type { Metadata } from "next";
import { Nav } from "@/components/layout/Nav";
import { FaqSection } from "@/components/home/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo/metadata";
import { faqJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { faq, resolveFaq } from "@/content/de/faq";
import { getSiteSettings } from "@/lib/events/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMetadata({ title: "FAQ – Fragen zum Paint & Drink Abend", description: "Muss ich malen können? Was ist inklusive? Wie lange dauert ein Abend? Antworten zu Tickets, Ablauf, Alter und Ort im BoLaGio Atelier Bayreuth.", path: "/faq" });

export default async function FaqPage() {
  const items = resolveFaq(faq, await getSiteSettings());
  return (
    <>
      <Nav />
      <main id="main" className="pt-16 md:pt-[4.5rem]">
        <JsonLd data={[faqJsonLd(items), breadcrumbJsonLd([{ name: "Start", path: "/" }, { name: "FAQ", path: "/faq" }])]} />
        <FaqSection items={items} />
      </main>
    </>
  );
}
