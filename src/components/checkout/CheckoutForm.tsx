"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { startCheckout, type CheckoutState } from "@/lib/actions/checkout";
import { Field, Input, Checkbox } from "@/components/ui/Field";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { formatMoney } from "@/lib/format/money";
import { vatIncluded } from "@/lib/format/money";
import { formatDateLong, formatTime, formatWeekday } from "@/lib/format/date";
import { site } from "@/config/site";
import { copy } from "@/content/de/copy";
import { checkoutPolicySummary } from "@/content/de/legal/ticketbedingungen";
import { track } from "@/lib/analytics";

interface EventSummary {
  slug: string;
  title: string;
  edition: string | null;
  startsAt: string;
  doorsAt: string;
  endsAt: string;
  priceCents: number;
  currency: string;
  vatRate: number;
  minimumAge: number | null;
  maxPerOrder: number;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-full" disabled={pending} aria-busy={pending}>
      {pending ? "Einen Moment …" : copy.checkout.pay}
    </button>
  );
}

export function CheckoutForm({ event, initialQuantity, holdMinutes }: { event: EventSummary; initialQuantity: number; holdMinutes: number }) {
  const [requestedQty, setQty] = useState(initialQuantity);
  const [state, action] = useActionState<CheckoutState, FormData>(startCheckout, {});
  const c = copy.checkout;
  // Clamp during render: if the server reported fewer seats, the UI follows immediately.
  const max = Math.max(1, state.remaining !== undefined ? Math.min(event.maxPerOrder, state.remaining) : event.maxPerOrder);
  const qty = Math.min(requestedQty, max);
  const total = event.priceCents * qty;
  const vat = vatIncluded(total, event.vatRate);

  useEffect(() => {
    track({ name: "checkout_started", props: { slug: event.slug, quantity: initialQuantity } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <form action={action} className="grid gap-14 lg:grid-cols-12" noValidate>
      <input type="hidden" name="slug" value={event.slug} />
      <input type="hidden" name="quantity" value={qty} />
      <div className="hidden" aria-hidden="true">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="lg:col-span-6 space-y-10">
        <section aria-labelledby="qty-title">
          <h2 id="qty-title" className="display-sm">
            {c.quantity}
          </h2>
          <div className="mt-5 flex items-center justify-between">
            <QuantityStepper value={qty} max={max} onChange={setQty} label={c.quantity} />
            <span className="text-sm text-muted">{copy.event.maxReached(event.maxPerOrder)}</span>
          </div>
        </section>

        <section aria-labelledby="customer-title" className="space-y-6">
          <h2 id="customer-title" className="display-sm">
            {c.customer}
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <Field label={c.firstName} name="firstName" error={state.fieldErrors?.firstName}>
              <Input name="firstName" autoComplete="given-name" required error={state.fieldErrors?.firstName} />
            </Field>
            <Field label={c.lastName} name="lastName" error={state.fieldErrors?.lastName}>
              <Input name="lastName" autoComplete="family-name" required error={state.fieldErrors?.lastName} />
            </Field>
          </div>
          <Field label={c.email} name="email" hint={c.emailHint} error={state.fieldErrors?.email}>
            <Input name="email" type="email" inputMode="email" autoComplete="email" required error={state.fieldErrors?.email} hint={c.emailHint} />
          </Field>
        </section>

        <section className="space-y-4 pt-2">
          <Checkbox
            name="terms"
            required
            error={state.fieldErrors?.terms}
            label={
              <>
                Ich habe die{" "}
                <Link href="/ticketbedingungen" target="_blank" className="underline">
                  {c.termsLink}
                </Link>{" "}
                gelesen und akzeptiere sie.
              </>
            }
          />
          <Checkbox name="marketing" label={c.marketing} />
          <p className="text-xs text-muted">
            {c.privacyNote.replace("Datenschutzerklärung.", "")}
            <Link href="/datenschutz" target="_blank" className="underline">
              {c.privacyLink}
            </Link>
            .
          </p>
        </section>
      </div>

      <aside className="lg:col-span-5 lg:col-start-8">
        <div className="border border-hairline-strong rounded-xs p-6 md:p-7 lg:sticky lg:top-28 bg-surface">
          <h2 className="eyebrow">{c.summary}</h2>
          <p className="font-display text-2xl mt-3">
            {event.title}
            {event.edition ? ` ${event.edition}` : ""}
          </p>
          <dl className="mt-4 text-sm space-y-1.5">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Datum</dt>
              <dd className="text-right">
                {formatWeekday(event.startsAt)}, {formatDateLong(event.startsAt)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Einlass / Beginn</dt>
              <dd className="tabular">
                {formatTime(event.doorsAt)} / {formatTime(event.startsAt)} Uhr
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Ort</dt>
              <dd className="text-right">
                {site.address.street}, {site.address.city}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Tickets</dt>
              <dd className="tabular">
                {qty} × {formatMoney(event.priceCents, event.currency)}
              </dd>
            </div>
          </dl>
          <div className="mt-5 pt-5 hairline-t flex items-baseline justify-between">
            <span>Gesamt</span>
            <span className="font-display text-3xl tabular">{formatMoney(total, event.currency)}</span>
          </div>
          <p className="text-xs text-muted mt-1 text-right">
            inkl. {event.vatRate}% MwSt. ({formatMoney(vat, event.currency)})
          </p>

          <div className="mt-6 space-y-2 text-xs text-muted">
            {event.minimumAge && <p>{c.ageNote(event.minimumAge)}</p>}
            <p>
              <strong className="text-text font-medium">{c.cancellationTitle}:</strong> {checkoutPolicySummary.cancellation}
            </p>
            <p>{checkoutPolicySummary.withdrawal}</p>
            <p>{c.holdNote(holdMinutes)}</p>
          </div>

          {state.error && (
            <p className="mt-5 text-sm text-wine" role="alert">
              {state.error}
            </p>
          )}

          <div className="mt-6">
            <SubmitButton />
            <p className="mt-3 text-xs text-muted text-center">{c.payNote}</p>
          </div>
        </div>
      </aside>
    </form>
  );
}
