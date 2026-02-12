import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { PainEventForm } from "@/components/forms/pain-event-form";
import { requireRole } from "@/lib/auth/server";

export default async function NewPainEventPage() {
  await requireRole("patient");

  return (
    <div className="max-w-xl">
      <PageHeader title="Registrar dolor" description="Completa este registro en menos de 30 segundos." />
      <Card>
        <PainEventForm />
      </Card>
    </div>
  );
}
