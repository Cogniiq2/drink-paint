import { ImageResponse } from "next/og";
import { getEventBySlug } from "@/lib/events/queries";
import { site } from "@/config/site";
import { formatDateLong, formatTime, formatWeekday } from "@/lib/format/date";

export const alt = `${site.brand.name} – Paint & Drink in Bayreuth`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Dynamic social preview: brand, title, date — subtle, typographic. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const view = await getEventBySlug(slug);
  const title = view ? `${view.event.title}${view.event.edition ? ` ${view.event.edition}` : ""}` : site.brand.name;
  const line = view ? `${formatWeekday(view.event.startsAt)}, ${formatDateLong(view.event.startsAt)} · ${formatTime(view.event.startsAt)} Uhr` : "Paint & Drink in Bayreuth";
  const status = view ? (view.availability.state === "sold_out" ? "Ausverkauft" : view.availability.label) : "";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#161411", color: "#EEE8DD", fontFamily: "Georgia, serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, letterSpacing: 1 }}>
          <span>
            {site.brand.wordmark[0]} <span style={{ fontStyle: "italic", opacity: 0.8 }}>{site.brand.wordmark[1]}</span>
          </span>
          <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 18, letterSpacing: 4, textTransform: "uppercase", opacity: 0.7 }}>Paint & Drink · Bayreuth</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 96, lineHeight: 0.95, letterSpacing: -3, maxWidth: 1000 }}>{title}</div>
          <div style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 30, opacity: 0.85 }}>{line}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Helvetica, Arial, sans-serif", fontSize: 22, opacity: 0.8 }}>
          <span>
            {site.address.street}, {site.address.city}
          </span>
          <span>{status}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
