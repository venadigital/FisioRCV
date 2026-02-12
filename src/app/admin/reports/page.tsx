import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";

export default async function AdminReportsPage() {
  const context = await requireRole("admin");
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [appointmentsResult, activePatientsResult, completionResult] = await Promise.all([
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", context.clinicId)
      .gte("scheduled_at", startOfMonth.toISOString()),
    supabase
      .from("patient_assignments")
      .select("patient_id")
      .eq("clinic_id", context.clinicId)
      .eq("active", true),
    supabase
      .from("exercise_completions")
      .select("id", { count: "exact", head: true }),
  ]);

  const activePatients = new Set((activePatientsResult.data ?? []).map((row) => row.patient_id)).size;

  return (
    <div>
      <PageHeader title="Reportes básicos" description="Citas, pacientes activos y adherencia agregada." />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <h2 className="text-sm font-semibold text-slate-500">Citas del mes</h2>
          <p className="mt-2 text-3xl font-bold text-cyan-800">{appointmentsResult.count ?? 0}</p>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-500">Pacientes activos</h2>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{activePatients}</p>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-500">Completaciones ejercicio</h2>
          <p className="mt-2 text-3xl font-bold text-slate-900">{completionResult.count ?? 0}</p>
        </Card>
      </div>
    </div>
  );
}
