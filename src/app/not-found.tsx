import Link from "next/link";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { Container, Section, Eyebrow } from "@/components/ui/Section";
import { copy } from "@/content/de/copy";

export default function NotFound() {
  const e = copy.errors;
  return (
    <>
      <Nav />
      <main id="main" className="pt-16 md:pt-[4.5rem] flex-1">
        <Section surface="bone" className="min-h-[70svh] flex items-center">
          <Container>
            <Eyebrow>404</Eyebrow>
            <h1 className="display-lg mt-4 max-w-[14ch]">{e.notFoundTitle}</h1>
            <p className="lede mt-6 text-muted max-w-[40ch]">{e.notFoundText}</p>
            <div className="mt-8 flex gap-4">
              <Link href="/" className="btn btn-primary">
                {e.notFoundCta}
              </Link>
              <Link href="/events" className="btn btn-outline">
                {copy.cta.allEvenings}
              </Link>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
