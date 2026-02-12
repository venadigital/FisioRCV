import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";
import { daysAgoIso } from "@/lib/date";
import { formatDateTime } from "@/lib/utils";

export default async function PatientHomePage() {
  const context = await requireRole("patient");
  const supabase = await createClient();

  const [nextAppointmentResult, weekPainResult] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, scheduled_at, status")
      .eq("patient_id", context.userId)
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("pain_events")
      .select("intensity")
      .eq("patient_id", context.userId)
      .gte("recorded_at", daysAgoIso(7)),
  ]);

  const weekPainEvents = weekPainResult.data ?? [];
  const weekAverage =
    weekPainEvents.length > 0
      ? weekPainEvents.reduce((acc, event) => acc + event.intensity, 0) / weekPainEvents.length
      : 0;

  return (
    <div>
      <PageHeader
        title="Inicio"
        description="Resumen de tu semana y acceso rápido a tus tareas."
        actions={
          <Link href="/patient/pain/new">
            <Button className="text-base">Registrar dolor</Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <h2 className="text-sm font-semibold text-slate-500">Próxima cita</h2>
          {nextAppointmentResult.data ? (
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {formatDateTime(nextAppointmentResult.data.scheduled_at)}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-600">Sin citas próximas</p>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-500">Promedio dolor (7 días)</h2>
          <p className="mt-2 text-3xl font-bold text-cyan-800">{weekAverage.toFixed(1)}/10</p>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-500">Registros semana</h2>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{weekPainEvents.length}</p>
        </Card>
      </div>
    </div>
  );
}
