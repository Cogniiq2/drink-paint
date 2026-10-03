import type { Metadata } from "next";
import { site } from "@/config/site";

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const DEFAULT_DESCRIPTION =
  `Paint & Drink in Bayreuth. Rund 20 Gäste, eine Leinwand pro Person, Farben, Schürze und Welcome Drink inklusive. Ausgewählte Abende in der ${site.address.street}. Plätze online buchen.`;

export function baseMetadata(): Metadata {
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: `${site.brand.name} – Paint & Drink in Bayreuth`,
      template: `%s · ${site.brand.name}`,
    },
    description: DEFAULT_DESCRIPTION,
    applicationName: site.brand.name,
    openGraph: {
      type: "website",
      siteName: site.brand.name,
      locale: "de_DE",
      images: [{ url: site.media.ogDefault, width: 1200, height: 630, alt: site.brand.name }],
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
    alternates: { canonical: "/" },
    formatDetection: { telephone: false },
  };
}

export function pageMetadata(opts: { title: string; description: string; path: string; image?: string; noIndex?: boolean }): Metadata {
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: opts.path },
    openGraph: {
      title: `${opts.title} · ${site.brand.name}`,
      description: opts.description,
      url: opts.path,
      images: opts.image ? [{ url: opts.image, width: 1200, height: 630 }] : undefined,
    },
    robots: opts.noIndex ? { index: false, follow: false } : undefined,
  };
}
