import { AppointmentStatusForm } from "@/components/forms/appointment-status-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";

export default async function TherapistAgendaPage() {
  const context = await requireRole("therapist");
  const supabase = await createClient();

  const { data: appointmentsData } = await supabase
    .from("appointments")
    .select("id, patient_id, scheduled_at, status, profiles!appointments_patient_id_fkey(full_name)")
    .eq("therapist_id", context.userId)
    .order("scheduled_at", { ascending: true })
    .limit(50);
  const appointments = appointmentsData ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Mi agenda" description="Calendario semanal y gestión de estado de citas." />

      <Card>
        <ul className="space-y-3">
          {appointments.length === 0 ? (
            <li className="text-sm text-slate-500">No hay citas registradas.</li>
          ) : (
            appointments.map((appointment) => {
              const patient = Array.isArray(appointment.profiles)
                ? appointment.profiles[0]
                : appointment.profiles;

              return (
                <li key={appointment.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">
                      {patient?.full_name ?? "Paciente"} -{" "}
                      {new Date(appointment.scheduled_at).toLocaleString("es-MX")}
                    </p>
                    <Badge>{appointment.status}</Badge>
                  </div>
                  <AppointmentStatusForm appointmentId={appointment.id} currentStatus={appointment.status} />
                </li>
              );
            })
          )}
        </ul>
      </Card>
    </div>
  );
}
