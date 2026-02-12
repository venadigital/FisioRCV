import { Card } from "@/components/ui/card";
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
      <header>
        <h1 className="text-6xl font-semibold tracking-tight text-[#4d74b9] md:text-7xl">Dashboard general</h1>
        <p className="mt-2 text-4xl text-slate-700">Métricas rápidas por sede.</p>
      </header>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <Card className="rounded-3xl border-slate-200 bg-white px-8 py-7 shadow-sm">
          <h2 className="text-4xl font-medium text-slate-600">Citas del mes</h2>
          <p className="mt-4 text-8xl font-semibold tracking-tight text-[#4d74b9]">{appointmentsResult.count ?? 0}</p>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white px-8 py-7 shadow-sm">
          <h2 className="text-4xl font-medium text-slate-600">Pacientes activos</h2>
          <p className="mt-4 text-8xl font-semibold tracking-tight text-[#9dc6be]">
            {activePatientsResult.count ?? 0}
          </p>
        </Card>
      </section>
    </div>
  );
}
