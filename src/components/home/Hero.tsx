import Image from "next/image";
import Link from "next/link";
import { site } from "@/config/site";
import { copy } from "@/content/de/copy";
import { publicFlags } from "@/config/flags";
import type { EventView } from "@/lib/events/queries";
import { formatDateShort, formatWeekdayShort } from "@/lib/format/date";
import { heroAvailabilityLine } from "@/lib/inventory/availability";
import { HeroFilm } from "@/components/media/HeroFilm";

export function Hero({ next }: { next: EventView | null }) {
  const h = copy.hero;
  const signal = next ? heroAvailabilityLine(next.availability) : null;
  const primaryHref = next ? `/events/${next.event.slug}` : "/events";

  return (
    <section className="relative min-h-[100svh] surface-dark flex flex-col justify-end overflow-hidden" aria-labelledby="hero-title">
      {/* Poster is the LCP element: priority, no JS dependency. */}
      <div className="absolute inset-0">
        <Image
          src={site.media.heroPoster}
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={70}
          className="object-cover"
        />
        {publicFlags.heroFilmEnabled && <HeroFilm src={site.media.heroFilm} srcMobile={site.media.heroFilmMobile} />}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-ink/30" aria-hidden="true" />
      </div>

      <div className="relative container-x mx-auto max-w-[1680px] w-full pb-10 md:pb-16 pt-32">
        <p className="eyebrow !text-bone/80 fade" style={{ ["--delay" as string]: "120ms" }}>
          {h.eyebrow}
        </p>
        <h1 id="hero-title" className="display-xl mt-5 max-w-[12ch]">
          {h.headline.map((line, i) => (
            <span key={line} className="mask-line">
              <span style={{ ["--delay" as string]: `${200 + i * 110}ms` }}>{line}</span>
            </span>
          ))}
        </h1>
        <p className="lede mt-7 max-w-[34ch] text-bone/90 rise" style={{ ["--delay" as string]: "620ms" }}>
          {h.sub}
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4 rise" style={{ ["--delay" as string]: "760ms" }}>
          <Link href={primaryHref} className="btn btn-primary !bg-ivory !text-ink !border-ivory hover:!bg-bone">
            <span>{copy.cta.chooseEvening}</span>
            <span className="btn-arrow" aria-hidden="true">→</span>
          </Link>
          <Link href="/atelier" className="btn btn-ghost !text-ivory">
            <span>{copy.cta.experience}</span>
            <span className="btn-underline" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-12 md:mt-16 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-sm text-bone/75 fade" style={{ ["--delay" as string]: "1000ms" }}>
          <p>{h.location}</p>
          {next && signal && (
            <p className="tabular">
              <span className="text-bone/55">{h.nextLabel} · </span>
              {formatWeekdayShort(next.event.startsAt)} {formatDateShort(next.event.startsAt)} · {signal}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
