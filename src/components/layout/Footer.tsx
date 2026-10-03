import Link from "next/link";
import { site } from "@/config/site";
import { copy } from "@/content/de/copy";
import { Container } from "@/components/ui/Section";
import { Wordmark } from "@/components/brand/Wordmark";
import { OpenConsentButton } from "./OpenConsentButton";

export function Footer({ showCookieSettings = false }: { showCookieSettings?: boolean }) {
  const f = copy.footer;
  return (
    <footer className="surface-dark py-16 md:py-24">
      <Container>
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Wordmark />
            <p className="mt-6 text-muted max-w-xs">{f.line}</p>
            <address className="mt-6 not-italic text-sm text-muted leading-relaxed">
              {site.company.legalName}
              <br />
              {site.address.street}
              <br />
              {site.address.postalCode} {site.address.city}
            </address>
          </div>
          <nav aria-label="Entdecken" className="md:col-span-3">
            <p className="eyebrow mb-4">Atelier</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/events" className="hover:opacity-70 transition-opacity">{f.explore.events}</Link></li>
              <li><Link href="/atelier" className="hover:opacity-70 transition-opacity">{f.explore.atelier}</Link></li>
              <li><Link href="/private-events" className="hover:opacity-70 transition-opacity">{f.explore.privateEvents}</Link></li>
              <li><Link href="/gutschein" className="hover:opacity-70 transition-opacity">{f.explore.voucher}</Link></li>
              <li><Link href="/faq" className="hover:opacity-70 transition-opacity">{f.explore.faq}</Link></li>
            </ul>
          </nav>
          <nav aria-label="Rechtliches" className="md:col-span-2">
            <p className="eyebrow mb-4">Rechtliches</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/impressum" className="hover:opacity-70 transition-opacity">{f.legal.impressum}</Link></li>
              <li><Link href="/datenschutz" className="hover:opacity-70 transition-opacity">{f.legal.datenschutz}</Link></li>
              <li><Link href="/ticketbedingungen" className="hover:opacity-70 transition-opacity">{f.legal.agb}</Link></li>
              <li><Link href="/contact" className="hover:opacity-70 transition-opacity">{f.legal.contact}</Link></li>
              {showCookieSettings && <li><OpenConsentButton label={f.legal.cookies} /></li>}
            </ul>
          </nav>
          <div className="md:col-span-2">
            <p className="eyebrow mb-4">Folgen</p>
            <a href={site.social.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-sm hover:opacity-70 transition-opacity">
              Instagram ↗
            </a>
          </div>
        </div>
        <div className="mt-16 pt-6 hairline-t flex flex-col sm:flex-row justify-between gap-2 text-xs text-muted">
          <span>{f.company}</span>
          <span>Alle Preise inkl. MwSt.</span>
        </div>
      </Container>
    </footer>
  );
}
