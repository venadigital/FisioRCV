import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";

export default async function AdminDashboardPage() {
  const context = await requireRole("admin");
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [appointmentsResult, activePatientsResult] = await Promise.all([
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", context.clinicId)
      .gte("scheduled_at", startOfMonth.toISOString()),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", context.clinicId)
      .eq("active", true),
  ]);

  return (
    <div>
      <PageHeader title="Dashboard general" description="Métricas rápidas por sede." />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-slate-500">Citas del mes</h2>
          <p className="mt-2 text-3xl font-bold text-cyan-800">{appointmentsResult.count ?? 0}</p>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-500">Pacientes activos</h2>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{activePatientsResult.count ?? 0}</p>
        </Card>
      </div>
    </div>
  );
}
