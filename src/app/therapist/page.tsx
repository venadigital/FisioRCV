import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";
import { daysAgoIso } from "@/lib/date";

export default async function TherapistDashboardPage() {
  const context = await requireRole("therapist");
  const supabase = await createClient();

  const { data: assignmentsData } = await supabase
    .from("patient_assignments")
    .select("patient_id")
    .eq("therapist_id", context.userId)
    .eq("active", true);
  const assignments = assignmentsData ?? [];

  const patientIds = assignments.map((item) => item.patient_id);

  const [patientsResult, appointmentsResult, painsResult] = await Promise.all([
    patientIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", patientIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    patientIds.length
      ? supabase
          .from("appointments")
          .select("patient_id, scheduled_at")
          .in("patient_id", patientIds)
          .eq("therapist_id", context.userId)
          .gte("scheduled_at", new Date().toISOString())
      : Promise.resolve({ data: [] as { patient_id: string; scheduled_at: string }[] }),
    patientIds.length
      ? supabase
          .from("pain_events")
          .select("patient_id, intensity, recorded_at")
          .in("patient_id", patientIds)
          .gte("recorded_at", daysAgoIso(7))
      : Promise.resolve({ data: [] as { patient_id: string; intensity: number; recorded_at: string }[] }),
  ]);

  const patients = patientsResult.data ?? [];
  const upcomingAppointments = appointmentsResult.data ?? [];
  const recentPains = painsResult.data ?? [];

  const painByPatient = new Map<string, number[]>();
  for (const pain of recentPains) {
    const list = painByPatient.get(pain.patient_id) ?? [];
    list.push(pain.intensity);
    painByPatient.set(pain.patient_id, list);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Pacientes asignados, dolor promedio 7 días y próxima cita."
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2">Paciente</th>
                <th className="py-2">Dolor 7 días</th>
                <th className="py-2">Próxima cita</th>
                <th className="py-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => {
                const values = painByPatient.get(patient.id) ?? [];
                const avg = values.length
                  ? (values.reduce((acc, item) => acc + item, 0) / values.length).toFixed(1)
                  : "-";
                const nextAppointment = upcomingAppointments
                  .filter((item) => item.patient_id === patient.id)
                  .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0];

                return (
                  <tr key={patient.id} className="border-b border-slate-100">
                    <td className="py-3 font-semibold text-slate-900">{patient.full_name}</td>
                    <td className="py-3">{avg}</td>
                    <td className="py-3">
                      {nextAppointment
                        ? new Date(nextAppointment.scheduled_at).toLocaleString("es-MX")
                        : "Sin cita"}
                    </td>
                    <td className="py-3">
                      <Link className="text-cyan-700 hover:underline" href={`/therapist/patients/${patient.id}`}>
                        Ver ficha
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {patients.length === 0 ? (
          <div className="mt-4">
            <Badge tone="warning">No hay pacientes asignados</Badge>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
