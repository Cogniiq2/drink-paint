import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/session";
import { getStore } from "@/lib/data";
import { EventForm } from "@/components/admin/EventForm";
import { NotifyGuestsForm } from "@/components/admin/NotifyGuestsForm";
import { H1, Stat, btnOutline } from "@/components/admin/ui";
import { deriveAvailability } from "@/lib/inventory/availability";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const store = getStore();
  const ev = await store.getEventById(id);
  if (!ev) notFound();
  const paid = await store.listPaidOrdersForEvent(id);
  const a = deriveAvailability(ev);
  return (
    <>
      <H1
        action={
          <div className="flex gap-2">
            <Link href={`/events/${ev.slug}`} className={btnOutline} target="_blank">Öffentliche Seite ↗</Link>
            <Link href={`/admin/attendees?event=${ev.id}`} className={btnOutline}>Gäste</Link>
          </div>
        }
      >
        {ev.title} {ev.edition}
      </H1>
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Stat label="Verkauft" value={ev.sold} />
        <Stat label="Reserviert" value={ev.held} />
        <Stat label="Frei" value={ev.remaining} />
        <Stat label="Anzeige" value={<span className="text-lg">{a.label}</span>} />
      </div>
      <EventForm event={ev} />
      <div className="mt-6">
        <NotifyGuestsForm eventId={ev.id} paidCount={paid.length} />
      </div>
    </>
  );
}
