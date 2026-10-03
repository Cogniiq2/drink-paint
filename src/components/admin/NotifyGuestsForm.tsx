"use client";

import { useActionState } from "react";
import { notifyGuestsAction, type NotifyState } from "@/lib/actions/admin";
import { btnOutline, input, label } from "./ui";

export function NotifyGuestsForm({ eventId, paidCount }: { eventId: string; paidCount: number }) {
  const [state, action, pending] = useActionState<NotifyState, FormData>(notifyGuestsAction.bind(null, eventId), {});
  return (
    <form
      action={action}
      className="bg-white border border-hairline rounded-md p-5 space-y-3"
      onSubmit={(e) => {
        const kind = (e.currentTarget.elements.namedItem("kind") as HTMLSelectElement).value;
        if (!confirm(kind === "cancelled" ? `Abend wirklich absagen und ${paidCount} Buchung(en) informieren?` : `Änderungsmail an ${paidCount} Buchung(en) senden?`)) e.preventDefault();
      }}
    >
      <h2 className="font-medium">Gäste informieren ({paidCount} bezahlte Buchungen)</h2>
      <div className="grid sm:grid-cols-[12rem_1fr] gap-3">
        <div>
          <label htmlFor="kind" className={label}>Art</label>
          <select id="kind" name="kind" className={input} defaultValue="changed">
            <option value="changed">Änderung (z. B. neue Uhrzeit)</option>
            <option value="cancelled">Absage (setzt Status auf „abgesagt“)</option>
          </select>
        </div>
        <div>
          <label htmlFor="note" className={label}>Nachricht an die Gäste</label>
          <textarea id="note" name="note" rows={2} className={input} required />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className={btnOutline} disabled={pending || paidCount === 0}>{pending ? "Sende …" : "Senden"}</button>
        {state.sent !== undefined && <span className="text-emerald-700">{state.sent} E-Mails gesendet.</span>}
        {state.error && <span className="text-red-700">{state.error}</span>}
      </div>
    </form>
  );
}
