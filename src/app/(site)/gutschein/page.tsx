import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/layout/Nav";
import { Container, Section, Eyebrow } from "@/components/ui/Section";
import { TrackOnMount } from "@/components/analytics/TrackOnMount";
import { WaitlistForm } from "@/components/forms/WaitlistForm";
import { pageMetadata } from "@/lib/seo/metadata";
import { env } from "@/config/env";
import { copy } from "@/content/de/copy";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMetadata({ title: "Gutschein – Ein Abend, verschenkt", description: "Verschenke einen Platz im BoLaGio Atelier Bayreuth: ein Paint & Drink Abend mit Leinwand, Farben und Welcome Drink.", path: "/gutschein" });

/**
 * Scaffold. When VOUCHERS_ENABLED is true this page will host the purchase
 * flow (fixed value, unique code, email delivery, checkout redemption).
 * Until then it honestly says "soon" and offers a notify-me entry.
 */
export default function VoucherPage() {
  const enabled = env().VOUCHERS_ENABLED;
  const v = copy.voucher;
  return (
    <>
      <Nav />
      <main id="main" className="pt-16 md:pt-[4.5rem]">
        <TrackOnMount event={{ name: "voucher_interest" }} />
        <Section surface="ivory">
          <Container>
            <div className="grid gap-12 md:grid-cols-12">
              <div className="md:col-span-6">
                <Eyebrow>{v.eyebrow}</Eyebrow>
                <h1 className="display-lg mt-4">{v.headline}</h1>
                <p className="lede mt-6 text-muted max-w-[38ch]">{v.text}</p>
                {!enabled && <p className="eyebrow mt-8">{v.soon}</p>}
                <Link href="/contact" className="btn btn-outline mt-6">
                  Kontakt
                </Link>
              </div>
              {!enabled && (
                <div className="md:col-span-5 md:col-start-8">
                  <p className="text-sm text-muted mb-6">Sag uns Bescheid, dann erfährst du als Erste:r, wenn Gutscheine verfügbar sind.</p>
                  <WaitlistForm options={[]} compact />
                </div>
              )}
            </div>
          </Container>
        </Section>
      </main>
    </>
  );
}
