import { AppointmentForm } from "@/components/forms/appointment-form";
import { AppointmentStatusMenu } from "@/components/forms/appointment-status-menu";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";

type StatusValue = "scheduled" | "completed" | "cancelled" | "no_show";

function formatHour(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function AdminAppointmentsPage() {
  const context = await requireRole("admin");
  const supabase = await createClient();

  const [appointmentsResult, profilesResult, rolesResult, clinicsResult] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id, patient_id, therapist_id, clinic_id, scheduled_at, status, profiles!appointments_patient_id_fkey(full_name), therapist:profiles!appointments_therapist_id_fkey(full_name), clinic:clinics(name)",
      )
      .eq("clinic_id", context.clinicId)
      .order("scheduled_at", { ascending: true })
      .limit(50),
    supabase.from("profiles").select("id, full_name").eq("clinic_id", context.clinicId),
    supabase.from("user_roles").select("user_id, role"),
    supabase.from("clinics").select("id, name").eq("active", true).order("created_at", { ascending: true }),
  ]);

  const roles = rolesResult.data ?? [];
  const roleMap = new Map(roles.map((item) => [item.user_id, item.role]));
  const profiles = profilesResult.data ?? [];
  const clinics = clinicsResult.data ?? [];

  const patients = profiles
    .filter((profile) => roleMap.get(profile.id) === "patient")
    .map((profile) => ({ id: profile.id, label: profile.full_name }));

  const therapists = profiles
    .filter((profile) => roleMap.get(profile.id) === "therapist")
    .map((profile) => ({ id: profile.id, label: profile.full_name }));

  const clinicOptions = clinics.map((clinic) => ({ id: clinic.id, label: clinic.name }));

  const appointments = appointmentsResult.data ?? [];
  const visibleAppointments = appointments.slice(0, 20);

  return (
    <div className="space-y-7">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight text-[#111827]">Agenda Maestra</h1>
          <p className="mt-2 text-2xl text-slate-500">Crear, editar estado y revisar citas de la sede.</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button className="h-12 rounded-xl border border-slate-300 bg-white px-5 text-base text-slate-700">▾ Filtrar</button>
          <button className="h-12 rounded-xl bg-[#9ec7be] px-6 text-base font-semibold text-white">⬇ Exportar</button>
        </div>
      </header>

      {context.clinicId ? (
        <Card className="rounded-2xl border-slate-200 bg-white p-0 shadow-sm">
          <div className="p-8">
            <h2 className="mb-6 flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-800">
              <span className="text-[#8abeb0]">▍</span>
              Crear cita
            </h2>
            <AppointmentForm
              defaultClinicId={context.clinicId}
              clinics={clinicOptions.length ? clinicOptions : [{ id: context.clinicId, label: "Sede" }]}
              patients={patients}
              therapists={therapists}
            />
          </div>
        </Card>
      ) : null}

      <Card className="rounded-2xl border-slate-200 bg-white p-0 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6">
          <h2 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-800">
            <span className="text-[#8abeb0]">▍</span>
            Citas programadas
          </h2>
          <input
            placeholder="Buscar por nombre o ID..."
            className="h-12 w-80 rounded-xl border border-slate-300 px-4 text-xl text-slate-700 outline-none focus:ring-2 focus:ring-[#5478bd]"
          />
        </div>

        <div className="overflow-x-auto px-8 py-5">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xl font-semibold text-slate-500">
                <th className="px-4 py-3">HORA</th>
                <th className="px-4 py-3">PACIENTE</th>
                <th className="px-4 py-3">TERAPEUTA</th>
                <th className="px-4 py-3">SEDE</th>
                <th className="px-4 py-3">ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {visibleAppointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-xl text-slate-500">
                    No hay citas programadas.
                  </td>
                </tr>
              ) : (
                visibleAppointments.map((appointment) => {
                  const patient = Array.isArray(appointment.profiles)
                    ? appointment.profiles[0]
                    : appointment.profiles;
                  const therapist = Array.isArray(appointment.therapist)
                    ? appointment.therapist[0]
                    : appointment.therapist;
                  const clinic = Array.isArray(appointment.clinic) ? appointment.clinic[0] : appointment.clinic;

                  const patientName = patient?.full_name ?? "Paciente";

                  return (
                    <tr key={appointment.id} className="border-t border-slate-200 text-xl text-slate-700">
                      <td className="px-4 py-4">
                        <p className="text-xl font-semibold text-slate-800">{formatHour(appointment.scheduled_at)}</p>
                        <p className="text-lg text-slate-500">{formatDay(appointment.scheduled_at)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dce7fb] text-sm font-semibold text-[#5478bd]">
                            {initials(patientName)}
                          </div>
                          <div>
                            <p className="text-xl font-medium text-slate-900">{patientName}</p>
                            <p className="text-lg text-slate-500">ID: #{appointment.patient_id.slice(0, 6)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xl">{therapist?.full_name ?? "-"}</td>
                      <td className="px-4 py-4 text-xl">{clinic?.name ?? "-"}</td>
                      <td className="px-4 py-4">
                        <AppointmentStatusMenu
                          appointmentId={appointment.id}
                          currentStatus={appointment.status as StatusValue}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-8 py-4">
          <p className="text-xl text-slate-500">
            Mostrando 1 a {Math.min(visibleAppointments.length, 20)} de {appointments.length} resultados
          </p>
          <div className="flex overflow-hidden rounded-xl border border-slate-300 text-base">
            <button className="h-12 w-12 border-r border-slate-300 text-slate-500">‹</button>
            <button className="h-12 w-12 border-r border-slate-300 bg-[#dbe8fb] font-semibold text-[#4364a2]">1</button>
            <button className="h-12 w-12 border-r border-slate-300 text-slate-600">2</button>
            <button className="h-12 w-12 text-slate-600">›</button>
          </div>
        </div>
      </Card>
    </div>
  );
}
