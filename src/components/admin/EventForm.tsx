"use client";

import { useActionState } from "react";
import type { EventRecord } from "@/lib/data/types";
import { toDateTimeLocalValue } from "@/lib/format/date";
import { createEventAction, updateEventAction, type EventFormState } from "@/lib/actions/admin";
import { btn, input, label } from "./ui";

export function EventForm({ event }: { event?: EventRecord }) {
  const action = event ? updateEventAction.bind(null, event.id) : createEventAction;
  const [state, formAction, pending] = useActionState<EventFormState, FormData>(action, {});
  const d = (iso?: string | null) => (iso ? toDateTimeLocalValue(iso) : "");

  return (
    <form action={formAction} className="bg-white border border-hairline rounded-md p-6 grid gap-5 md:grid-cols-2">
      <F id="title" l="Titel" def={event?.title} required />
      <F id="edition" l="Edition (z. B. No. 03)" def={event?.edition ?? ""} />
      <F id="slug" l="Slug (URL)" def={event?.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" />
      <F id="subtitle" l="Untertitel" def={event?.subtitle ?? ""} />
      <div className="md:col-span-2">
        <label htmlFor="description" className={label}>Beschreibung (Absätze durch Leerzeile)</label>
        <textarea id="description" name="description" rows={5} defaultValue={event?.description ?? ""} className={input} />
      </div>
      <F id="doorsAt" l="Einlass" type="datetime-local" def={d(event?.doorsAt)} required />
      <F id="startsAt" l="Beginn" type="datetime-local" def={d(event?.startsAt)} required />
      <F id="endsAt" l="Ende" type="datetime-local" def={d(event?.endsAt)} required />
      <F id="capacity" l="Kapazität" type="number" def={String(event?.capacity ?? 20)} required />
      <F id="priceEuro" l="Preis pro Person (EUR, inkl. MwSt.)" type="number" step="0.01" def={event ? (event.priceCents / 100).toFixed(2) : "54.00"} required />
      <F id="vatRate" l="MwSt. %" type="number" step="0.01" def={String(event?.vatRate ?? 19)} required />
      <F id="minimumAge" l="Mindestalter (leer = keins)" type="number" def={event?.minimumAge == null ? "18" : String(event.minimumAge)} />
      <div>
        <label htmlFor="status" className={label}>Status</label>
        <select id="status" name="status" defaultValue={event?.status ?? "draft"} className={input}>
          <option value="draft">Entwurf (nicht sichtbar)</option>
          <option value="published">Veröffentlicht</option>
          <option value="cancelled">Abgesagt</option>
          <option value="archived">Archiviert</option>
        </select>
      </div>
      <F id="salesOpenAt" l="Verkaufsstart (optional)" type="datetime-local" def={d(event?.salesOpenAt)} />
      <F id="salesCloseAt" l="Verkaufsende (optional)" type="datetime-local" def={d(event?.salesCloseAt)} />
      <F id="heroImagePath" l="Bild (Pfad unter /media/)" def={event?.heroImagePath ?? "/media/table-wide.webp"} required />
      <F id="heroImageAlt" l="Bild Alt-Text" def={event?.heroImageAlt ?? ""} />
      <F id="maxTicketsPerOrder" l="Max. Tickets pro Buchung" type="number" def={String(event?.maxTicketsPerOrder ?? 6)} required />
      <div className="grid grid-cols-2 gap-3">
        <F id="lowThreshold" l="Schwelle „x von y frei“ ≤" type="number" def={String(event?.lowThreshold ?? 14)} required />
        <F id="fewThreshold" l="Schwelle „Noch x“ ≤" type="number" def={String(event?.fewThreshold ?? 5)} required />
      </div>
      <div className="md:col-span-2 flex items-center gap-4">
        <button className={btn} disabled={pending}>{pending ? "Speichern …" : event ? "Speichern" : "Anlegen"}</button>
        {state.ok && <span className="text-emerald-700">Gespeichert.</span>}
        {state.error && <span className="text-red-700" role="alert">{state.error}</span>}
      </div>
    </form>
  );
}

function F({ id, l, def, type = "text", required, step, pattern }: { id: string; l: string; def?: string; type?: string; required?: boolean; step?: string; pattern?: string }) {
  return (
    <div>
      <label htmlFor={id} className={label}>{l}</label>
      <input id={id} name={id} type={type} defaultValue={def} required={required} step={step} pattern={pattern} className={input} />
    </div>
  );
}
