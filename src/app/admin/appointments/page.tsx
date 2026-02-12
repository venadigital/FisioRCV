import { AppointmentForm } from "@/components/forms/appointment-form";
import { AppointmentStatusForm } from "@/components/forms/appointment-status-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";

export default async function AdminAppointmentsPage() {
  const context = await requireRole("admin");
  const supabase = await createClient();

  const [appointmentsResult, profilesResult, rolesResult] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id, patient_id, therapist_id, scheduled_at, status, profiles!appointments_patient_id_fkey(full_name), therapist:profiles!appointments_therapist_id_fkey(full_name)",
      )
      .eq("clinic_id", context.clinicId)
      .order("scheduled_at", { ascending: true })
      .limit(50),
    supabase.from("profiles").select("id, full_name").eq("clinic_id", context.clinicId),
    supabase.from("user_roles").select("user_id, role"),
  ]);

  const roles = rolesResult.data ?? [];
  const roleMap = new Map(roles.map((item) => [item.user_id, item.role]));
  const profiles = profilesResult.data ?? [];

  const patients = profiles
    .filter((profile) => roleMap.get(profile.id) === "patient")
    .map((profile) => ({ id: profile.id, label: profile.full_name }));

  const therapists = profiles
    .filter((profile) => roleMap.get(profile.id) === "therapist")
    .map((profile) => ({ id: profile.id, label: profile.full_name }));

  return (
    <div className="space-y-6">
      <PageHeader title="Agenda maestra" description="Crear, editar estado y revisar citas de la sede." />

      {context.clinicId ? (
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Crear cita</h2>
          <AppointmentForm clinicId={context.clinicId} patients={patients} therapists={therapists} />
        </Card>
      ) : null}

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Citas programadas</h2>
        <ul className="space-y-3">
          {(appointmentsResult.data ?? []).map((appointment) => {
            const patient = Array.isArray(appointment.profiles)
              ? appointment.profiles[0]
              : appointment.profiles;
            const therapist = Array.isArray(appointment.therapist)
              ? appointment.therapist[0]
              : appointment.therapist;

            return (
              <li key={appointment.id} className="rounded-md border border-slate-200 p-3">
                <p className="font-semibold text-slate-900">
                  {new Date(appointment.scheduled_at).toLocaleString("es-MX")}
                </p>
                <p className="text-sm text-slate-600">
                  Paciente: {patient?.full_name ?? "-"} | Terapeuta: {therapist?.full_name ?? "-"}
                </p>
                <div className="mt-2">
                  <AppointmentStatusForm appointmentId={appointment.id} currentStatus={appointment.status} />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
