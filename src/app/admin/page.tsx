import Link from "next/link";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";

type ClinicRow = {
  id: string;
  name: string;
  active: boolean;
};

type ProfileRow = {
  id: string;
  clinic_id: string;
  active: boolean;
};

type RoleRow = {
  user_id: string;
  role: "admin" | "therapist" | "patient";
};

type AppointmentRow = {
  clinic_id: string;
  scheduled_at: string;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
};

type ClinicMetrics = {
  clinicId: string;
  clinicName: string;
  therapists: number;
  patients: number;
  appointmentsToday: number;
  monthlyAppointments: number;
  active: boolean;
};

function monthBoundaries() {
  const now = new Date();
  const startCurrent = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const startPrevious = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const startNext = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return {
    now,
    startCurrentIso: startCurrent.toISOString(),
    startPreviousIso: startPrevious.toISOString(),
    startNextIso: startNext.toISOString(),
  };
}

function isSameUtcDay(dateString: string, now: Date) {
  const date = new Date(dateString);
  return (
    date.getUTCFullYear() === now.getUTCFullYear() &&
    date.getUTCMonth() === now.getUTCMonth() &&
    date.getUTCDate() === now.getUTCDate()
  );
}

function percentDelta(current: number, previous: number) {
  if (previous === 0) {
    return null;
  }

  return Math.round(((current - previous) / previous) * 100);
}

export default async function AdminDashboardPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const { now, startCurrentIso, startPreviousIso, startNextIso } = monthBoundaries();

  const [clinicsResult, profilesResult, rolesResult, appointmentsResult] = await Promise.all([
    supabase.from("clinics").select("id, name, active").order("created_at", { ascending: true }),
    supabase.from("profiles").select("id, clinic_id, active"),
    supabase.from("user_roles").select("user_id, role"),
    supabase
      .from("appointments")
      .select("clinic_id, scheduled_at, status")
      .gte("scheduled_at", startPreviousIso)
      .lt("scheduled_at", startNextIso),
  ]);

  const clinics = ((clinicsResult.data ?? []) as ClinicRow[]).slice(0, 4);
  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const roles = (rolesResult.data ?? []) as RoleRow[];
  const appointments = (appointmentsResult.data ?? []) as AppointmentRow[];

  const roleByUserId = new Map(roles.map((role) => [role.user_id, role.role]));

  const metricsByClinicId = new Map<string, ClinicMetrics>();
  for (const clinic of clinics) {
    metricsByClinicId.set(clinic.id, {
      clinicId: clinic.id,
      clinicName: clinic.name,
      therapists: 0,
      patients: 0,
      appointmentsToday: 0,
      monthlyAppointments: 0,
      active: clinic.active,
    });
  }

  for (const profile of profiles) {
    const clinic = metricsByClinicId.get(profile.clinic_id);
    if (!clinic) continue;

    const role = roleByUserId.get(profile.id);
    if (role === "therapist" && profile.active) {
      clinic.therapists += 1;
    }

    if (role === "patient" && profile.active) {
      clinic.patients += 1;
    }
  }

  let totalAppointmentsThisMonth = 0;
  let totalAppointmentsPreviousMonth = 0;

  for (const appointment of appointments) {
    const clinic = metricsByClinicId.get(appointment.clinic_id);
    if (!clinic) continue;

    if (appointment.scheduled_at >= startCurrentIso) {
      totalAppointmentsThisMonth += 1;
      clinic.monthlyAppointments += 1;
      if (isSameUtcDay(appointment.scheduled_at, now)) {
        clinic.appointmentsToday += 1;
      }
    } else {
      totalAppointmentsPreviousMonth += 1;
    }
  }

  const clinicMetrics = Array.from(metricsByClinicId.values());
  const totalActivePatients = clinicMetrics.reduce((acc, item) => acc + item.patients, 0);
  const trend = percentDelta(totalAppointmentsThisMonth, totalAppointmentsPreviousMonth);

  const chartData = clinicMetrics.slice(0, 3).map((item) => ({
    name: item.clinicName,
    value: item.monthlyAppointments,
  }));

  const maxValue = Math.max(...chartData.map((item) => item.value), 1);

  return (
    <div>
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-[#4d74b9] md:text-4xl">Dashboard general</h1>
        <p className="mt-2 text-xl text-slate-700">Métricas rápidas por sede y estado general.</p>
      </header>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <Card className="rounded-3xl border-slate-200 bg-white px-8 py-7 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-medium text-slate-600">Citas del mes</h2>
              <div className="mt-4 flex items-end gap-3">
                <p className="text-4xl font-semibold tracking-tight text-[#6f95d3]">{totalAppointmentsThisMonth}</p>
                <p className="mb-2 rounded-full bg-[#edf4ea] px-3 py-1 text-base text-[#7ea79f]">
                  {trend === null ? "N/A" : `${trend > 0 ? "+" : ""}${trend}% vs mes anterior`}
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-3xl text-slate-300">🗓</div>
          </div>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white px-8 py-7 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-medium text-slate-600">Pacientes activos</h2>
              <div className="mt-4 flex items-end gap-3">
                <p className="text-4xl font-semibold tracking-tight text-[#8fbeb6]">{totalActivePatients}</p>
                <p className="mb-2 rounded-full bg-[#edf2fb] px-3 py-1 text-base text-[#6d8fcb]">
                  Actualmente en terapia
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-3xl text-slate-300">👥</div>
          </div>
        </Card>
      </section>

      <section className="mt-7 grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-2xl font-semibold tracking-tight text-[#4d74b9]">Métricas por Sede</h3>

          <div className="mt-8 flex h-64 items-end justify-center gap-4">
            {chartData.length === 0 ? (
              <p className="text-base text-slate-500">Sin datos de sedes.</p>
            ) : (
              chartData.map((item, index) => {
                const height = Math.max(Math.round((item.value / maxValue) * 180), 24);
                const tones = ["bg-[#769acb]", "bg-[#88b0a9]", "bg-[#9fadca]"];

                return (
                  <div key={item.name} className="flex w-20 flex-col items-center gap-2">
                    <div className="relative flex h-48 w-full items-end">
                      <div
                        className={`w-full rounded-t-2xl ${tones[index % tones.length]}`}
                        style={{ height: `${height}px` }}
                      />
                    </div>
                    <p className="text-base font-medium text-slate-600">{item.name}</p>
                  </div>
                );
              })
            )}
          </div>

          <p className="mt-5 text-center text-base text-slate-400">Rendimiento mensual comparativo</p>
        </Card>

        <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white p-0 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <h3 className="text-2xl font-semibold tracking-tight text-[#4d74b9]">Estado de Sedes</h3>
            <Link href="/admin/clinics" className="text-lg font-medium text-[#6e93cf] hover:text-[#4d74b9]">
              Ver todo
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-[#f4f5f8] text-left text-base font-semibold text-slate-500">
                  <th className="px-6 py-4">SEDE</th>
                  <th className="px-6 py-4">TERAPEUTAS</th>
                  <th className="px-6 py-4">PACIENTES TOTALES</th>
                  <th className="px-6 py-4">CITAS HOY</th>
                  <th className="px-6 py-4">ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {clinicMetrics.length === 0 ? (
                  <tr>
                    <td className="px-6 py-8 text-base text-slate-500" colSpan={5}>
                      No hay sedes registradas.
                    </td>
                  </tr>
                ) : (
                  clinicMetrics.map((clinic) => (
                    <tr key={clinic.clinicId} className="border-t border-slate-200 text-lg text-slate-700">
                      <td className="px-6 py-4 font-medium">{clinic.clinicName}</td>
                      <td className="px-6 py-4">{clinic.therapists}</td>
                      <td className="px-6 py-4 text-[#4d74b9]">{clinic.patients}</td>
                      <td className="px-6 py-4">{clinic.appointmentsToday}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-base ${
                            clinic.active
                              ? "bg-[#edf4ea] text-[#3b8a60]"
                              : "bg-[#fff6e6] text-[#b18126]"
                          }`}
                        >
                          <span>•</span>
                          {clinic.active ? "Operativo" : "Mantenimiento"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}
