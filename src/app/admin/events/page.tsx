import Link from "next/link";
import { requireAdmin } from "@/lib/admin/session";
import { getStore } from "@/lib/data";
import { formatDateTime } from "@/lib/format/date";
import { formatMoney } from "@/lib/format/money";
import { deriveAvailability } from "@/lib/inventory/availability";
import { H1, Table, Th, Td, Badge, btn, btnOutline } from "@/components/admin/ui";
import { duplicateEventAction, setEventStatusAction } from "@/lib/actions/admin";

const tone = { draft: "neutral", published: "ok", cancelled: "bad", archived: "neutral" } as const;

export default async function AdminEvents() {
  await requireAdmin();
  const events = await getStore().listAllEvents();
  return (
    <>
      <H1 action={<Link href="/admin/events/new" className={btn}>Neuer Abend</Link>}>Abende</H1>
      <Table>
        <thead>
          <tr>
            <Th>Abend</Th>
            <Th>Datum</Th>
            <Th>Status</Th>
            <Th className="text-right">Preis</Th>
            <Th className="text-right">Verkauft / Frei</Th>
            <Th>Verfügbarkeit</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => {
            const a = deriveAvailability(ev);
            return (
              <tr key={ev.id}>
                <Td>
                  <Link href={`/admin/events/${ev.id}`} className="font-medium hover:underline">
                    {ev.title} {ev.edition}
                  </Link>
                  <div className="text-xs text-muted">/events/{ev.slug}</div>
                </Td>
                <Td className="whitespace-nowrap">{formatDateTime(ev.startsAt)}</Td>
                <Td><Badge tone={tone[ev.status]}>{ev.status}</Badge></Td>
                <Td className="text-right tabular">{formatMoney(ev.priceCents, ev.currency)}</Td>
                <Td className="text-right tabular">{ev.sold} / {ev.remaining}{ev.held > 0 && <span className="text-muted"> (+{ev.held} reserviert)</span>}</Td>
                <Td>{a.label}</Td>
                <Td className="whitespace-nowrap">
                  <div className="flex gap-2 justify-end">
                    {ev.status === "published" ? (
                      <form action={setEventStatusAction.bind(null, ev.id, "draft")}><button className={btnOutline}>Verbergen</button></form>
                    ) : (
                      <form action={setEventStatusAction.bind(null, ev.id, "published")}><button className={btnOutline}>Veröffentlichen</button></form>
                    )}
                    <form action={duplicateEventAction.bind(null, ev.id)}><button className={btnOutline}>Duplizieren</button></form>
                  </div>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </>
  );
}
