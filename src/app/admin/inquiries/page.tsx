import { requireAdmin } from "@/lib/admin/session";
import { getStore } from "@/lib/data";
import { formatDateTime } from "@/lib/format/date";
import { Card, H1, Badge, btnOutline } from "@/components/admin/ui";
import { updateInquiryStatusAction } from "@/lib/actions/admin";

export default async function InquiriesPage() {
  await requireAdmin();
  const list = await getStore().listInquiries();
  return (
    <>
      <H1>Anfragen für private Abende</H1>
      {list.length === 0 && <Card>Noch keine Anfragen.</Card>}
      <div className="space-y-4">
        {list.map((q) => (
          <Card key={q.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-medium">{q.eventType} · {q.guests} Gäste · {q.name}</h2>
                <p className="text-xs text-muted mt-0.5">
                  <a href={`mailto:${q.email}`} className="underline">{q.email}</a>{q.phone ? ` · ${q.phone}` : ""} · {formatDateTime(q.createdAt)}
                </p>
                <p className="text-xs text-muted">Wunsch: {q.preferredDate ?? "–"}{q.alternativeDate ? ` · Alternativ: ${q.alternativeDate}` : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={q.status === "new" ? "warn" : q.status === "contacted" ? "ok" : "neutral"}>{q.status}</Badge>
                {q.status !== "contacted" && <form action={updateInquiryStatusAction.bind(null, q.id, "contacted")}><button className={btnOutline}>Kontaktiert</button></form>}
                {q.status !== "closed" && <form action={updateInquiryStatusAction.bind(null, q.id, "closed")}><button className={btnOutline}>Schließen</button></form>}
              </div>
            </div>
            {q.message && <p className="mt-3 whitespace-pre-line text-sm">{q.message}</p>}
          </Card>
        ))}
      </div>
    </>
  );
}
