import { Card } from "@/components/ui/card";
import { AdminAppointmentsTrendChart } from "@/components/charts/admin-appointments-trend-chart";
import { AdminStatusDistributionChart } from "@/components/charts/admin-status-distribution-chart";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";

type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show";

function formatMonthLabel(date: Date) {
  const raw = date.toLocaleDateString("es-MX", { month: "short" }).replace(".", "");
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function formatRelativeDateTime(isoDate: string) {
  const date = new Date(isoDate);
  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((today.getTime() - target.getTime()) / 86_400_000);

  const timeLabel = date.toLocaleTimeString("es-MX", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (dayDiff === 0) return `Hoy, ${timeLabel}`;
  if (dayDiff === 1) return `Ayer, ${timeLabel}`;

  const dateLabel = date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
  });

  return `${dateLabel}, ${timeLabel}`;
}

function statusLabel(status: AppointmentStatus) {
  if (status === "completed") return "Completada";
  if (status === "scheduled") return "Programada";
  if (status === "cancelled") return "Cancelada";
  return "Ausente";
}

function statusTone(status: AppointmentStatus) {
  if (status === "completed") {
    return "bg-[#dff4e5] text-[#2a885b]";
  }

  if (status === "scheduled") {
    return "bg-[#dbe9ff] text-[#2f5cae]";
  }

  if (status === "cancelled") {
    return "bg-[#fee8e8] text-[#c45353]";
  }

  return "bg-slate-200 text-slate-700";
}

function appointmentType(status: AppointmentStatus) {
  if (status === "completed") return "Terapia Física";
  if (status === "scheduled") return "Seguimiento";
  if (status === "cancelled") return "Consulta";
  return "Control";
}

export default async function AdminReportsPage() {
  const context = await requireRole("admin");
  const supabase = await createClient();
  const now = new Date();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const startOfTrend = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [monthAppointmentsResult, trendAppointmentsResult, assignmentsResult, recentAppointmentsResult] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("id, status, scheduled_at")
        .eq("clinic_id", context.clinicId)
        .gte("scheduled_at", startOfMonth.toISOString()),
      supabase
        .from("appointments")
        .select("scheduled_at")
        .eq("clinic_id", context.clinicId)
        .gte("scheduled_at", startOfTrend.toISOString()),
      supabase.from("patient_assignments").select("patient_id, active").eq("clinic_id", context.clinicId),
      supabase
        .from("appointments")
        .select("id, scheduled_at, status, patient:profiles!appointments_patient_id_fkey(full_name)")
        .eq("clinic_id", context.clinicId)
        .order("scheduled_at", { ascending: false })
        .limit(8),
    ]);

  const assignments = assignmentsResult.data ?? [];
  const allPatientIds = Array.from(new Set(assignments.map((row) => row.patient_id)));
  const activePatients = new Set(assignments.filter((row) => row.active).map((row) => row.patient_id)).size;

  let completionCount = 0;

  if (allPatientIds.length > 0) {
    const completionResult = await supabase
      .from("exercise_completions")
      .select("id", { count: "exact", head: true })
      .in("patient_id", allPatientIds);

    completionCount = completionResult.count ?? 0;
  }

  const monthAppointments = (monthAppointmentsResult.data ?? []) as Array<{
    id: string;
    status: AppointmentStatus;
    scheduled_at: string;
  }>;

  const trendAppointments = (trendAppointmentsResult.data ?? []) as Array<{ scheduled_at: string }>;

  const trendMonths = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);

    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      month: formatMonthLabel(date),
    };
  });

  const trendCountMap = new Map(trendMonths.map((item) => [item.key, 0]));

  for (const appointment of trendAppointments) {
    const date = new Date(appointment.scheduled_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    trendCountMap.set(key, (trendCountMap.get(key) ?? 0) + 1);
  }

  const trendData = trendMonths.map((item) => ({
    month: item.month,
    total: trendCountMap.get(item.key) ?? 0,
  }));

  const statusTotals: Record<AppointmentStatus, number> = {
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
  };

  for (const appointment of monthAppointments) {
    statusTotals[appointment.status] += 1;
  }

  const statusData = [
    { label: "Programadas", value: statusTotals.scheduled, color: "#4b70ba" },
    { label: "Completadas", value: statusTotals.completed, color: "#8abeb0" },
    { label: "Canceladas", value: statusTotals.cancelled, color: "#d8dee8" },
    { label: "Ausentes", value: statusTotals.no_show, color: "#f3be7a" },
  ];

  const recentAppointments = (recentAppointmentsResult.data ?? []) as Array<{
    id: string;
    scheduled_at: string;
    status: AppointmentStatus;
    patient: { full_name: string | null } | Array<{ full_name: string | null }> | null;
  }>;

  const monthAppointmentsCount = monthAppointments.length;

  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const previousMonthAppointmentsResult = await supabase
    .from("appointments")
    .select("id")
    .eq("clinic_id", context.clinicId)
    .gte("scheduled_at", previousMonthStart.toISOString())
    .lte("scheduled_at", previousMonthEnd.toISOString());

  const previousMonthCount = previousMonthAppointmentsResult.data?.length ?? 0;
  const appointmentDelta =
    previousMonthCount === 0 ? 0 : Math.round(((monthAppointmentsCount - previousMonthCount) / previousMonthCount) * 100);

  const deltaLabel =
    previousMonthCount === 0
      ? "Sin referencia anterior"
      : `${appointmentDelta > 0 ? "+" : ""}${appointmentDelta}% vs mes anterior`;

  const activeStatusCount = statusTotals.scheduled + statusTotals.completed;

  const activePatientsHint =
    activeStatusCount > 0 ? "Con actividad de citas reciente" : "Sin cambios vs mes anterior";

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight text-[#111827]">Reportes básicos</h1>
          <p className="mt-2 text-2xl text-slate-500">Citas, pacientes activos y adherencia agregada.</p>
        </div>

        <div className="flex h-12 items-center overflow-hidden rounded-xl border border-slate-300 bg-white text-base">
          <button className="h-full bg-[#f7f8fb] px-6 font-medium text-slate-800">Mes actual</button>
          <button className="h-full border-l border-slate-200 px-6 text-slate-500">Últimos 3 meses</button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-semibold uppercase tracking-wide text-slate-500">Citas del mes</h2>
            <span className="rounded-xl bg-[#e8eefb] px-4 py-3 text-base text-[#4b70ba]">▣</span>
          </div>
          <p className="mt-6 text-5xl font-semibold text-[#4b70ba]">{monthAppointmentsCount}</p>
          <p className="mt-1 text-xl text-slate-400">{deltaLabel}</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-semibold uppercase tracking-wide text-slate-500">Pacientes activos</h2>
            <span className="rounded-xl bg-[#e7f4f0] px-4 py-3 text-base text-[#178f78]">✚</span>
          </div>
          <p className="mt-6 text-5xl font-semibold text-[#178f78]">{activePatients}</p>
          <p className="mt-1 text-xl text-slate-400">{activePatientsHint}</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-semibold uppercase tracking-wide text-slate-500">Completaciones ejercicio</h2>
            <span className="rounded-xl bg-[#ececfd] px-4 py-3 text-base text-[#5954de]">◉</span>
          </div>
          <p className="mt-6 text-5xl font-semibold text-[#0f172a]">{completionCount}</p>
          <p className="mt-1 text-xl text-slate-400">Total acumulado</p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card className="rounded-2xl border-slate-200 bg-white p-0 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-7 py-6">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-900">Tendencia de Citas</h2>
            <button className="text-xl font-medium text-[#3d65b5]">Ver detalle</button>
          </div>
          <div className="px-6 py-3">
            <AdminAppointmentsTrendChart data={trendData} />
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white p-0 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-6">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Distribución por Estado</h2>
            <span className="text-xl text-slate-400">•••</span>
          </div>
          <div className="px-4">
            <AdminStatusDistributionChart data={statusData} />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 pb-6 text-base text-slate-600">
            {statusData.map((slice) => (
              <div key={slice.label} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: slice.color }} />
                <span>{slice.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl border-slate-200 bg-white p-0 shadow-sm">
        <div className="border-b border-slate-200 px-7 py-6">
          <h2 className="text-4xl font-semibold tracking-tight text-slate-900">Actividad Reciente</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#f7f8fb] text-left text-base font-semibold text-slate-500">
                <th className="px-7 py-4">PACIENTE</th>
                <th className="px-7 py-4">TIPO</th>
                <th className="px-7 py-4">FECHA</th>
                <th className="px-7 py-4 text-right">ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {recentAppointments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-7 py-10 text-center text-xl text-slate-500">
                    No hay actividad reciente.
                  </td>
                </tr>
              ) : (
                recentAppointments.map((appointment) => {
                  const patientEntry = Array.isArray(appointment.patient)
                    ? appointment.patient[0]
                    : appointment.patient;
                  const patientName = patientEntry?.full_name ?? "Paciente";

                  return (
                    <tr key={appointment.id} className="border-t border-slate-200 text-xl text-slate-700">
                      <td className="px-7 py-5 font-medium text-slate-900">{patientName}</td>
                      <td className="px-7 py-5 text-slate-600">{appointmentType(appointment.status)}</td>
                      <td className="px-7 py-5 text-slate-500">{formatRelativeDateTime(appointment.scheduled_at)}</td>
                      <td className="px-7 py-5 text-right">
                        <span
                          className={`inline-flex rounded-full px-4 py-1 text-base font-medium ${statusTone(
                            appointment.status,
                          )}`}
                        >
                          {statusLabel(appointment.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
