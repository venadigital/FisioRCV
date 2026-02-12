import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { SessionNoteForm } from "@/components/forms/session-note-form";
import { PainWeeklyChart } from "@/components/charts/pain-weekly-chart";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";

export default async function TherapistPatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await requireRole("therapist");
  const { id } = await params;
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("patient_assignments")
    .select("id")
    .eq("patient_id", id)
    .eq("therapist_id", context.userId)
    .eq("active", true)
    .maybeSingle();

  if (!assignment) {
    return (
      <Card>
        <p className="text-sm text-rose-700">No tienes acceso a este paciente.</p>
      </Card>
    );
  }

  const [profileResult, painResult, appointmentResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name, phone").eq("id", id).single(),
    supabase
      .from("pain_events")
      .select("recorded_at, intensity, body_part, trigger")
      .eq("patient_id", id)
      .order("recorded_at", { ascending: false })
      .limit(30),
    supabase
      .from("appointments")
      .select("id, scheduled_at")
      .eq("patient_id", id)
      .eq("therapist_id", context.userId)
      .order("scheduled_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const patient = profileResult.data;
  const events = painResult.data ?? [];

  const chartData = events
    .slice()
    .reverse()
    .map((event) => ({
      week: new Date(event.recorded_at).toLocaleDateString("es-MX", { month: "short", day: "numeric" }),
      avgIntensity: event.intensity,
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={patient?.full_name ?? "Paciente"}
        description="Timeline de dolor, eventos recientes y nota de sesión"
      />

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Timeline de dolor</h2>
        <PainWeeklyChart data={chartData} />
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Eventos recientes</h2>
        <ul className="space-y-2 text-sm">
          {events.map((event, idx) => (
            <li key={`${event.recorded_at}-${idx}`} className="rounded-md border border-slate-200 p-2">
              <p className="font-semibold text-slate-900">
                {new Date(event.recorded_at).toLocaleString("es-MX")} - {event.intensity}/10
              </p>
              <p className="text-slate-600">
                {event.body_part} | {event.trigger}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      {appointmentResult.data ? (
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Nota de sesión</h2>
          <SessionNoteForm appointmentId={appointmentResult.data.id} patientId={id} />
        </Card>
      ) : null}
    </div>
  );
}
