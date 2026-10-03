import { requireAdmin } from "@/lib/admin/session";
import { getStore } from "@/lib/data";
import { formatDateShort } from "@/lib/format/date";
import { formatMoney } from "@/lib/format/money";
import { H1, Table, Th, Td, Badge, btnOutline, input } from "@/components/admin/ui";
import { toggleCheckInAction } from "@/lib/actions/admin";

const statusTone = { paid: "ok", refunded: "neutral", cancelled: "neutral", requires_review: "warn", pending: "neutral", expired: "neutral" } as const;

export default async function AttendeesPage({ searchParams }: { searchParams: Promise<{ event?: string; q?: string }> }) {
  await requireAdmin();
  const { event, q } = await searchParams;
  const store = getStore();
  const [rows, events] = await Promise.all([store.listAttendees({ eventId: event || undefined, query: q || undefined }), store.listAllEvents()]);
  const exportHref = `/api/admin/export?${new URLSearchParams({ ...(event ? { event } : {}), ...(q ? { q } : {}) })}`;

  return (
    <>
      <H1 action={<a href={exportHref} className={btnOutline}>CSV exportieren</a>}>Gäste</H1>
      <form className="flex flex-wrap gap-3 mb-4" method="get">
        <select name="event" defaultValue={event ?? ""} className={`${input} !w-auto`}>
          <option value="">Alle Abende</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>{formatDateShort(e.startsAt)} · {e.title} {e.edition}</option>
          ))}
        </select>
        <input name="q" defaultValue={q ?? ""} placeholder="Name, E-Mail, Referenz" className={`${input} !w-64`} />
        <button className={btnOutline}>Filtern</button>
      </form>
      <Table>
        <thead>
          <tr>
            <Th>Referenz</Th>
            <Th>Gast</Th>
            <Th>Abend</Th>
            <Th className="text-right">Tickets</Th>
            <Th className="text-right">Betrag</Th>
            <Th>Zahlung</Th>
            <Th>Check-in</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><Td className="text-muted">Keine Buchungen.</Td></tr>
          )}
          {rows.map(({ order, event: ev, tickets }) => (
            <tr key={order.id}>
              <Td className="font-mono text-xs">{order.orderNumber}</Td>
              <Td>
                {order.firstName} {order.lastName}
                <div className="text-xs text-muted">{order.email}{order.marketingConsent ? " · Newsletter ✓" : ""}</div>
              </Td>
              <Td>{ev.title}<div className="text-xs text-muted">{formatDateShort(ev.startsAt)}</div></Td>
              <Td className="text-right tabular">{order.quantity}</Td>
              <Td className="text-right tabular">{formatMoney(order.totalCents, order.currency)}</Td>
              <Td><Badge tone={statusTone[order.status]}>{order.status}</Badge></Td>
              <Td>
                <ul className="space-y-1">
                  {tickets.map((t) => (
                    <li key={t.id} className="flex items-center gap-2">
                      <span className="font-mono text-xs">{t.code}</span>
                      {t.status === "refunded" || t.status === "cancelled" ? (
                        <Badge>{t.status}</Badge>
                      ) : (
                        <form action={toggleCheckInAction.bind(null, t.id, t.status !== "checked_in")}>
                          <button className={`text-xs px-2 py-0.5 rounded-xs border ${t.status === "checked_in" ? "bg-emerald-100 border-emerald-300 text-emerald-900" : "border-hairline-strong hover:border-ink"}`}>
                            {t.status === "checked_in" ? "eingecheckt ✓" : "einchecken"}
                          </button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
