import { requireAdmin } from "@/lib/admin/session";
import { EventForm } from "@/components/admin/EventForm";
import { H1 } from "@/components/admin/ui";

export default async function NewEventPage() {
  await requireAdmin();
  return (
    <>
      <H1>Neuer Abend</H1>
      <EventForm />
    </>
  );
}
