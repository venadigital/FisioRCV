import { AdminCreateUserForm } from "@/components/forms/admin-create-user-form";
import { AdminPatientAssignmentsButton } from "@/components/forms/admin-patient-assignments-button";
import { AdminUserStatusToggle } from "@/components/forms/admin-user-status-toggle";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";

type RoleLabel = "admin" | "therapist" | "patient" | "sin rol";
type AssignmentRow = { patient_id: string; therapist_id: string; is_primary: boolean; active: boolean };

function isMissingIsPrimaryColumn(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false;
  if (error.code === "42703") return true;
  return (error.message ?? "").includes("patient_assignments.is_primary");
}

function roleTag(role: RoleLabel) {
  if (role === "admin") {
    return <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700">admin</span>;
  }

  if (role === "therapist") {
    return (
      <span className="rounded-full bg-[#dbe9ff] px-3 py-1 text-sm font-medium text-[#2f5cae]">fisioterapeuta</span>
    );
  }

  if (role === "patient") {
    return <span className="rounded-full bg-[#e8f5ff] px-3 py-1 text-sm font-medium text-[#1d7395]">paciente</span>;
  }

  return <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-500">sin rol</span>;
}

function stateTag(active: boolean) {
  if (active) {
    return <span className="rounded-full bg-[#dff4e5] px-3 py-1 text-sm font-medium text-[#2a885b]">activo</span>;
  }

  return <span className="rounded-full bg-[#fee8e8] px-3 py-1 text-sm font-medium text-[#b84a4a]">inactivo</span>;
}

export default async function AdminUsersPage() {
  const context = await requireRole("admin");
  const supabase = await createClient();

  const [profilesResult, rolesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, phone, active")
      .eq("clinic_id", context.clinicId)
      .order("created_at", { ascending: false })
      .limit(80),
    supabase.from("user_roles").select("user_id, role"),
  ]);

  let activeAssignments: AssignmentRow[] = [];

  const assignmentsResult = await supabase
    .from("patient_assignments")
    .select("patient_id, therapist_id, is_primary, active")
    .eq("clinic_id", context.clinicId)
    .eq("active", true);

  if (!assignmentsResult.error) {
    activeAssignments = (assignmentsResult.data ?? []) as AssignmentRow[];
  } else if (isMissingIsPrimaryColumn(assignmentsResult.error)) {
    const legacyAssignmentsResult = await supabase
      .from("patient_assignments")
      .select("patient_id, therapist_id, active")
      .eq("clinic_id", context.clinicId)
      .eq("active", true);

    activeAssignments = (legacyAssignmentsResult.data ?? []).map((assignment) => ({
      patient_id: assignment.patient_id,
      therapist_id: assignment.therapist_id,
      active: assignment.active,
      is_primary: false,
    }));
  }

  const profiles = profilesResult.data ?? [];
  const roles = rolesResult.data ?? [];

  const roleMap = new Map(roles.map((item) => [item.user_id, item.role]));
  const visibleRows = profiles.slice(0, 20);

  const therapistOptions = profiles
    .filter((profile) => profile.active && roleMap.get(profile.id) === "therapist")
    .map((profile) => ({ id: profile.id, label: profile.full_name }));

  const assignmentsByPatient = new Map<string, { primary: string | null; secondary: string[] }>();

  for (const assignment of activeAssignments) {
    const current = assignmentsByPatient.get(assignment.patient_id) ?? {
      primary: null,
      secondary: [],
    };

    if (assignment.is_primary) {
      current.primary = assignment.therapist_id;
    } else {
      current.secondary.push(assignment.therapist_id);
    }

    assignmentsByPatient.set(assignment.patient_id, current);
  }

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight text-[#111827]">Gestión de usuarios</h1>
        <p className="mt-2 text-xl text-slate-500">Crear usuarios y revisar estado de cuenta.</p>
      </header>

      {context.clinicId ? (
        <Card className="rounded-2xl border-slate-200 bg-white p-0 shadow-sm">
          <div className="p-8">
            <h2 className="mb-6 text-2xl font-semibold tracking-tight text-slate-800">Crear usuario</h2>
            <AdminCreateUserForm clinicId={context.clinicId} />
          </div>
        </Card>
      ) : null}

      <Card className="rounded-2xl border-slate-200 bg-white p-0 shadow-sm">
        <div className="border-b border-slate-200 px-8 py-6">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-800">Usuarios de la sede</h2>
        </div>

        <ul>
          {visibleRows.length === 0 ? (
            <li className="px-8 py-8 text-base text-slate-500">No hay usuarios registrados.</li>
          ) : (
            visibleRows.map((profile) => {
              const role = (roleMap.get(profile.id) ?? "sin rol") as RoleLabel;
              const assignmentState = assignmentsByPatient.get(profile.id) ?? { primary: null, secondary: [] };

              return (
                <li
                  key={profile.id}
                  className="flex items-center justify-between gap-4 border-b border-slate-200 px-8 py-6 last:border-b-0"
                >
                  <div>
                    <p className="text-xl font-medium text-slate-900">{profile.full_name}</p>
                    <p className="mt-1 text-base text-slate-500">{profile.phone}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3">
                    {roleTag(role)}
                    {stateTag(Boolean(profile.active))}

                    <AdminUserStatusToggle userId={profile.id} active={Boolean(profile.active)} />

                    {role === "patient" && context.clinicId ? (
                      <AdminPatientAssignmentsButton
                        patientId={profile.id}
                        clinicId={context.clinicId}
                        therapists={therapistOptions}
                        initialPrimaryTherapistId={assignmentState.primary}
                        initialSecondaryTherapistIds={assignmentState.secondary}
                      />
                    ) : null}
                  </div>
                </li>
              );
            })
          )}
        </ul>

        <div className="flex items-center justify-between border-t border-slate-200 px-8 py-4">
          <p className="text-base text-slate-500">
            Mostrando 1 a {Math.min(visibleRows.length, 20)} de {profiles.length} resultados
          </p>

          <div className="flex overflow-hidden rounded-xl border border-slate-300 text-sm">
            <button className="h-10 w-10 border-r border-slate-300 text-slate-500">‹</button>
            <button className="h-10 w-10 border-r border-slate-300 bg-[#d5e5eb] font-semibold text-[#0e7a9a]">1</button>
            <button className="h-10 w-10 border-r border-slate-300 text-slate-600">2</button>
            <button className="h-10 w-10 text-slate-600">›</button>
          </div>
        </div>
      </Card>
    </div>
  );
}
