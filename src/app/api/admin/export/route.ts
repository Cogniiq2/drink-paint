import { isAdmin } from "@/lib/admin/session";
import { getStore } from "@/lib/data";
import { formatDateShort } from "@/lib/format/date";

export const dynamic = "force-dynamic";

const csvCell = (v: string | number) => {
  const s = String(v ?? "");
  // Prevent CSV formula injection and quote as needed.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",;\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const url = new URL(req.url);
  const rows = await getStore().listAttendees({ eventId: url.searchParams.get("event") || undefined, query: url.searchParams.get("q") || undefined });
  const header = ["Referenz", "Vorname", "Nachname", "E-Mail", "Abend", "Datum", "Tickets", "Betrag", "Währung", "Status", "Ticketcodes", "Eingecheckt", "Newsletter", "Gebucht am"];
  const lines = rows.map(({ order, event, tickets }) =>
    [
      order.orderNumber, order.firstName, order.lastName, order.email, event.title, formatDateShort(event.startsAt), order.quantity,
      (order.totalCents / 100).toFixed(2), order.currency, order.status, tickets.map((t) => t.code).join(" "),
      tickets.filter((t) => t.status === "checked_in").length, order.marketingConsent ? "ja" : "nein", order.createdAt,
    ].map(csvCell).join(";"),
  );
  const body = "﻿" + [header.join(";"), ...lines].join("\r\n");
  return new Response(body, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="gaeste-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
  });
}
