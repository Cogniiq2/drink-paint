"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { formatPrice } from "@/lib/format/money";
import { copy } from "@/content/de/copy";
import { track } from "@/lib/analytics";
import type { AvailabilityState } from "@/lib/inventory/availability";

export interface LiveAvailability {
  state: AvailabilityState;
  remaining: number;
  capacity: number;
  label: string;
  bookable: boolean;
  waitlist: boolean;
  maxPerOrder: number;
}

/**
 * Sticky purchase placard. Quantity defaults to 1 and can never exceed live
 * availability; availability is refreshed on focus and every 45 s. The
 * server re-validates everything again on checkout.
 */
export function PurchaseModule({
  slug,
  priceCents,
  currency,
  maxPerOrder,
  minimumAge,
  initial,
  salesEnabled,
}: {
  slug: string;
  title: string;
  priceCents: number;
  currency: string;
  maxPerOrder: number;
  minimumAge: number | null;
  initial: LiveAvailability;
  salesEnabled: boolean;
}) {
  const [live, setLive] = useState<LiveAvailability>(initial);
  const [qty, setQty] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const t = copy.event;

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const res = await fetch(`/api/events/${slug}/availability`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as LiveAvailability;
        if (!active) return;
        setOffline(false);
        setLive(data);
        setQty((q) => {
          if (data.remaining > 0 && q > data.remaining) {
            setNotice(t.onlyLeft(data.remaining));
            return data.remaining;
          }
          return q;
        });
      } catch {
        if (active) setOffline(true);
      }
    };
    const id = setInterval(refresh, 45_000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [slug, t]);

  const max = Math.max(1, Math.min(maxPerOrder, live.remaining));
  const total = priceCents * qty;
  const soldOut = live.state === "sold_out";
  const preLaunch = !salesEnabled && live.state !== "sold_out" && live.state !== "past" && live.state !== "closed";

  return (
    <div className="border border-hairline-strong rounded-xs p-6 md:p-7 bg-surface">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-3xl tabular">
          {formatPrice(priceCents, currency)}
          <span className="font-sans text-sm text-muted ml-2">{t.perPerson}</span>
        </p>
        <p className="text-xs text-muted">{t.priceVat}</p>
      </div>

      <div className="mt-5 flex items-center gap-2 text-sm" aria-live="polite">
        <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${soldOut ? "bg-current opacity-40" : live.state === "few" ? "bg-wine" : "bg-current"}`} />
        <span className="tabular">{live.label}</span>
        {offline && <span className="text-muted">· offline</span>}
      </div>

      {minimumAge && <p className="mt-3 text-xs text-muted">{t.ageLine(minimumAge)}</p>}

      <div className="mt-6 hairline-t pt-6">
        {soldOut ? (
          <>
            <p className="font-display text-2xl">{t.soldOut}</p>
            <p className="mt-2 text-sm text-muted">{copy.faq && "Wird ein Platz frei, sagen wir dir zuerst Bescheid."}</p>
            <Link href={`/waitlist?event=${slug}`} className="btn btn-primary w-full mt-5" onClick={() => track({ name: "event_cta_click", props: { slug, quantity: 0 } })}>
              {copy.cta.waitlist}
            </Link>
          </>
        ) : live.state === "coming_soon" ? (
          <>
            <p className="font-display text-2xl">{t.salesSoon}</p>
            <Link href={`/waitlist?event=${slug}`} className="btn btn-primary w-full mt-5">
              {copy.cta.notify}
            </Link>
          </>
        ) : live.state === "closed" || live.state === "past" ? (
          <p className="text-muted">{t.salesClosed}</p>
        ) : preLaunch ? (
          <>
            <p className="font-display text-2xl">{t.preLaunch}</p>
            <p className="mt-2 text-sm text-muted">{t.preLaunchSub}</p>
            <Link href={`/waitlist?event=${slug}`} className="btn btn-primary w-full mt-5">
              {copy.cta.notify}
            </Link>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm">{t.quantity}</span>
              <QuantityStepper
                value={qty}
                max={max}
                onChange={(v) => {
                  setNotice(null);
                  setQty(v);
                }}
                label={t.quantity}
              />
            </div>
            {qty >= max && max < maxPerOrder && <p className="mt-2 text-xs text-muted text-right">{t.onlyLeft(live.remaining)}</p>}
            {qty >= maxPerOrder && <p className="mt-2 text-xs text-muted text-right">{t.maxReached(maxPerOrder)}</p>}
            {notice && (
              <p className="mt-3 text-sm text-wine" role="status">
                {notice}
              </p>
            )}
            <div className="mt-5 flex items-baseline justify-between">
              <span className="text-sm text-muted">{t.total}</span>
              <span className="font-display text-2xl tabular">{formatPrice(total, currency)}</span>
            </div>
            <Link
              href={`/checkout/${slug}?qty=${qty}`}
              className="btn btn-primary w-full mt-5"
              onClick={() => track({ name: "event_cta_click", props: { slug, quantity: qty } })}
            >
              <span>{t.buy}</span>
              <span className="btn-arrow" aria-hidden="true">→</span>
            </Link>
            <p className="mt-3 text-xs text-muted text-center">Welcome Drink inklusive · keine Buchungsgebühr</p>
          </>
        )}
      </div>
    </div>
  );
}
