import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";
import { nowTimestampMs } from "@/lib/date";
import { formatDateTime } from "@/lib/utils";

export default async function PatientAppointmentsPage() {
  const context = await requireRole("patient");
  const supabase = await createClient();

  const { data: appointmentsData } = await supabase
    .from("appointments")
    .select("id, scheduled_at, status")
    .eq("patient_id", context.userId)
    .order("scheduled_at", { ascending: false });
  const appointments = appointmentsData ?? [];

  const now = nowTimestampMs();
  const upcoming = appointments.filter((item) => new Date(item.scheduled_at).getTime() >= now);
  const history = appointments.filter((item) => new Date(item.scheduled_at).getTime() < now);

  return (
    <div className="space-y-6">
      <PageHeader title="Mis citas" description="Próximas citas e historial." />

      <Card>
        <h2 className="text-lg font-semibold">Próximas</h2>
        <ul className="mt-3 space-y-2">
          {upcoming.length === 0 ? (
            <li className="text-sm text-slate-500">No hay citas próximas.</li>
          ) : (
            upcoming.map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <span className="font-medium">{formatDateTime(item.scheduled_at)}</span>
                <Badge>{item.status}</Badge>
              </li>
            ))
          )}
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Historial</h2>
        <ul className="mt-3 space-y-2">
          {history.length === 0 ? (
            <li className="text-sm text-slate-500">No hay citas pasadas.</li>
          ) : (
            history.map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <span className="font-medium">{formatDateTime(item.scheduled_at)}</span>
                <Badge>{item.status}</Badge>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}
