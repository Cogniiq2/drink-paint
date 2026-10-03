import { SkipLink } from "@/components/layout/SkipLink";
import { Footer } from "@/components/layout/Footer";
import { publicFlags } from "@/config/flags";

/**
 * Public site shell. The Nav is rendered per page so the hero pages can tell
 * it to float transparently; every page wraps content in <main id="main">.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipLink />
      {children}
      <Footer showCookieSettings={publicFlags.analyticsProvider !== "none" && publicFlags.analyticsProvider !== "console"} />
    </>
  );
}
