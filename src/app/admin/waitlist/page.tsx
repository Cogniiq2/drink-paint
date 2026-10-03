import { requireAdmin } from "@/lib/admin/session";
import { getStore } from "@/lib/data";
import { formatDateShort } from "@/lib/format/date";
import { deriveAvailability } from "@/lib/inventory/availability";
import { Card, H1, Badge, btnOutline } from "@/components/admin/ui";
import { notifyWaitlistAction } from "@/lib/actions/admin";

export default async function WaitlistPage() {
  await requireAdmin();
  const store = getStore();
  const [entries, events] = await Promise.all([store.listWaitlist(), store.listAllEvents()]);
  const byEvent = events.map((ev) => ({ ev, list: entries.filter((w) => w.eventId === ev.id) })).filter((g) => g.list.length > 0);

  return (
    <>
      <H1>Warteliste</H1>
      {byEvent.length === 0 && <Card>Noch keine Einträge.</Card>}
      <div className="space-y-4">
        {byEvent.map(({ ev, list }) => {
          const a = deriveAvailability(ev);
          const waiting = list.filter((w) => w.status === "waiting");
          const wanted = waiting.reduce((n, w) => n + w.quantity, 0);
          const notify = notifyWaitlistAction.bind(null, ev.id);
          return (
            <Card key={ev.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-medium">{ev.title} {ev.edition} · {formatDateShort(ev.startsAt)}</h2>
                  <p className="text-xs text-muted mt-0.5">{a.label} · {waiting.length} wartend ({wanted} Plätze gewünscht)</p>
                </div>
                <form action={notify}>
                  <button className={btnOutline} disabled={a.remaining === 0 || waiting.length === 0}>
                    {a.remaining === 0 ? "Keine freien Plätze" : `${waiting.length} benachrichtigen`}
                  </button>
                </form>
              </div>
              <ul className="mt-3 divide-y divide-hairline text-sm">
                {list.map((w) => (
                  <li key={w.id} className="py-2 flex flex-wrap justify-between gap-2">
                    <span>{w.name} · {w.email} · {w.quantity} {w.quantity === 1 ? "Platz" : "Plätze"}</span>
                    <Badge tone={w.status === "waiting" ? "warn" : w.status === "notified" ? "ok" : "neutral"}>{w.status}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </>
  );
}
