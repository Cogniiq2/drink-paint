import { requireAdmin } from "@/lib/admin/session";
import { getStore } from "@/lib/data";
import { env } from "@/config/env";
import { Card, H1, btnOutline, input, label } from "@/components/admin/ui";
import { saveSettingAction } from "@/lib/actions/admin";
import { legalPlaceholders } from "@/content/de/legal/placeholders";
import { faq } from "@/content/de/faq";

const generalKeys: { key: string; label: string; hint?: string }[] = [
  { key: "public_sales_enabled", label: "Verkauf aktiv (true/false)", hint: "Wirkt nur, wenn PUBLIC_SALES_ENABLED in der Umgebung ebenfalls true ist." },
  { key: "instagram_url", label: "Instagram-URL" },
  { key: "contact_email", label: "Kontakt-E-Mail" },
];

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await getStore().getSettings();
  const val = (k: string) => (settings[k] === undefined ? "" : String(settings[k]));

  return (
    <>
      <H1>Einstellungen</H1>
      <p className="text-xs text-muted mb-6">
        Umgebung: PUBLIC_SALES_ENABLED={String(env().PUBLIC_SALES_ENABLED)} · HOLD_MINUTES={env().HOLD_MINUTES}. Werte hier überschreiben die Standardwerte aus dem Code.
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-medium mb-4">Allgemein</h2>
          <div className="space-y-4">
            {generalKeys.map((g) => (
              <Setting key={g.key} k={g.key} l={g.label} v={val(g.key)} hint={g.hint} />
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-medium mb-1">Impressum / Rechtliches</h2>
          <p className="text-xs text-muted mb-4">Leer = Platzhalter bleibt sichtbar markiert.</p>
          <div className="space-y-4">
            {Object.keys(legalPlaceholders).map((k) => (
              <Setting key={k} k={`legal.${k}`} l={k} v={val(`legal.${k}`)} />
            ))}
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="font-medium mb-1">FAQ-Antworten (Policies)</h2>
          <p className="text-xs text-muted mb-4">Nur für Fragen mit Regelungscharakter. Leer = Standardtext.</p>
          <div className="grid gap-4 md:grid-cols-2">
            {faq.filter((f) => f.policy).map((f) => (
              <Setting key={f.id} k={`faq.${f.id}`} l={f.q} v={val(`faq.${f.id}`)} textarea />
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function Setting({ k, l, v, hint, textarea }: { k: string; l: string; v: string; hint?: string; textarea?: boolean }) {
  return (
    <form action={saveSettingAction} className="flex gap-2 items-end">
      <input type="hidden" name="key" value={k} />
      <div className="flex-1">
        <label htmlFor={k} className={label}>{l}</label>
        {textarea ? <textarea id={k} name="value" defaultValue={v} rows={3} className={input} /> : <input id={k} name="value" defaultValue={v} className={input} />}
        {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
      </div>
      <button className={btnOutline}>Speichern</button>
    </form>
  );
}
