import Link from "next/link";
import { requireAdmin } from "@/lib/admin/session";
import { getStore } from "@/lib/data";
import { devOutbox } from "@/lib/email/mailer";
import { hasResend, hasStripe } from "@/config/env";
import { formatMoney } from "@/lib/format/money";
import { formatDateTime } from "@/lib/format/date";
import { Card, H1, Stat, Badge, btnOutline } from "@/components/admin/ui";
import { markRefundedAction } from "@/lib/actions/admin";

export default async function AdminDashboard() {
  await requireAdmin();
  const store = getStore();
  const [stats, attendees] = await Promise.all([store.getDashboardStats(), store.listAttendees({})]);
  const review = attendees.filter((a) => a.order.status === "requires_review");
  const outbox = store.kind === "memory" ? devOutbox().slice(0, 8) : [];

  return (
    <>
      <H1>Übersicht</H1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="sm:col-span-2">
          <p className="text-xs text-muted uppercase tracking-wider">Nächster Abend</p>
          {stats.nextEvent ? (
            <>
              <p className="font-display text-2xl mt-1">
                <Link href={`/admin/events/${stats.nextEvent.id}`} className="hover:underline">
                  {stats.nextEvent.title} {stats.nextEvent.edition}
                </Link>
              </p>
              <p className="text-muted mt-1">{formatDateTime(stats.nextEvent.startsAt)}</p>
            </>
          ) : (
            <p className="mt-2 text-muted">Kein veröffentlichter Abend.</p>
          )}
        </Card>
        <Stat label="Verkauft" value={`${stats.ticketsSold} / ${stats.nextEvent?.capacity ?? "–"}`} />
        <Stat label="Frei" value={stats.remainingSeats} />
        <Stat label="Aktive Reservierungen" value={stats.activeHolds} />
        <Stat label="Umsatz (bezahlt)" value={formatMoney(stats.revenueCents)} />
        <Stat label="Warteliste" value={stats.waitlistCount} />
        <Stat label="Neue Anfragen" value={stats.newInquiries} />
        {stats.ordersRequiringReview > 0 && <Stat label="Zu prüfen" value={stats.ordersRequiringReview} tone="warn" />}
      </div>

      {review.length > 0 && (
        <Card className="mt-6 border-amber-300">
          <h2 className="font-medium">Bezahlt, aber ohne Platz</h2>
          <p className="text-xs text-muted mt-1">Zahlung nach Ablauf der Reservierung eingegangen, Plätze waren weg. Bitte persönlich klären, im Stripe-Dashboard erstatten und hier als erstattet markieren.</p>
          <ul className="mt-3 divide-y divide-hairline">
            {review.map(({ order, event }) => (
              <li key={order.id} className="py-2 flex flex-wrap items-center justify-between gap-3">
                <span>
                  <span className="font-mono">{order.orderNumber}</span> · {order.firstName} {order.lastName} · {order.email} · {order.quantity}× {event.title} · {formatMoney(order.totalCents, order.currency)}
                </span>
                <form action={markRefundedAction.bind(null, order.id)}>
                  <button className={btnOutline}>Als erstattet markieren</button>
                </form>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <Card>
          <h2 className="font-medium mb-3">Integrationen</h2>
          <ul className="space-y-2">
            <li className="flex justify-between"><span>Datenbank</span><Badge tone={store.kind === "supabase" ? "ok" : "warn"}>{store.kind === "supabase" ? "Supabase" : "In-Memory (Demo)"}</Badge></li>
            <li className="flex justify-between"><span>Stripe</span><Badge tone={hasStripe() ? "ok" : "warn"}>{hasStripe() ? "konfiguriert" : "fehlt – Zahlung simuliert"}</Badge></li>
            <li className="flex justify-between"><span>E-Mail (Resend)</span><Badge tone={hasResend() ? "ok" : "warn"}>{hasResend() ? "konfiguriert" : "Dev-Outbox"}</Badge></li>
          </ul>
        </Card>
        {store.kind === "memory" && (
          <Card>
            <h2 className="font-medium mb-3">Dev-Outbox (letzte E-Mails)</h2>
            {outbox.length === 0 ? (
              <p className="text-muted">Noch keine E-Mails.</p>
            ) : (
              <ul className="space-y-1 text-xs">
                {outbox.map((m, i) => (
                  <li key={i} className="truncate">
                    <span className="text-muted">{Array.isArray(m.to) ? m.to.join(", ") : m.to}</span> · {m.subject}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
