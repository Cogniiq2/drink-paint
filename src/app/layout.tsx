import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { site } from "@/config/site";
import { baseMetadata } from "@/lib/seo/metadata";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";

const serif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const sans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-instrument-sans",
  display: "swap",
});

export const metadata: Metadata = baseMetadata();

export const viewport: Viewport = {
  themeColor: "#161411",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={site.locale.default.split("-")[0]} className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        {/* Marks JS availability before paint so reveal states never hide content without JS. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.setAttribute('data-js','')" }} />
      </head>
      <body className="min-h-dvh flex flex-col">
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
