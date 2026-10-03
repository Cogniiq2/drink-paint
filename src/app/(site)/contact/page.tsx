import type { Metadata } from "next";
import { Nav } from "@/components/layout/Nav";
import { Container, Section, Eyebrow } from "@/components/ui/Section";
import { Location } from "@/components/home/Location";
import { pageMetadata } from "@/lib/seo/metadata";
import { site } from "@/config/site";
import { copy } from "@/content/de/copy";

export const metadata: Metadata = pageMetadata({ title: "Kontakt", description: `Fragen zu Abenden, Tickets oder privaten Anlässen im BoLaGio Atelier Bayreuth. ${site.address.street}, ${site.address.postalCode} ${site.address.city}.`, path: "/contact" });

export default function ContactPage() {
  const c = copy.contact;
  return (
    <>
      <Nav />
      <main id="main" className="pt-16 md:pt-[4.5rem]">
        <Section surface="bone">
          <Container>
            <Eyebrow>{c.eyebrow}</Eyebrow>
            <h1 className="display-lg mt-4">{c.headline}</h1>
            <p className="lede mt-6 text-muted max-w-[40ch]">{c.text}</p>
            <dl className="mt-10 max-w-md hairline-t">
              <div className="grid grid-cols-[6rem_1fr] gap-4 py-3 hairline-b text-sm">
                <dt className="text-muted">E-Mail</dt>
                <dd>
                  <a href={`mailto:${site.contact.email}`} className="underline hover:no-underline">
                    {site.contact.email}
                  </a>
                </dd>
              </div>
              {site.contact.phone && (
                <div className="grid grid-cols-[6rem_1fr] gap-4 py-3 hairline-b text-sm">
                  <dt className="text-muted">Telefon</dt>
                  <dd>{site.contact.phone}</dd>
                </div>
              )}
              <div className="grid grid-cols-[6rem_1fr] gap-4 py-3 hairline-b text-sm">
                <dt className="text-muted">Instagram</dt>
                <dd>
                  <a href={site.social.instagramUrl} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
                    @{site.social.instagramHandle}
                  </a>
                </dd>
              </div>
              <div className="grid grid-cols-[6rem_1fr] gap-4 py-3 hairline-b text-sm">
                <dt className="text-muted">Betreiber</dt>
                <dd>{site.company.legalName}</dd>
              </div>
            </dl>
          </Container>
        </Section>
        <Location />
      </main>
    </>
  );
}
