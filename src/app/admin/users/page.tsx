import { InviteUserForm } from "@/components/forms/invite-user-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";

export default async function AdminUsersPage() {
  const context = await requireRole("admin");
  const supabase = await createClient();

  const [profilesResult, rolesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, phone, active")
      .eq("clinic_id", context.clinicId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("user_roles").select("user_id, role"),
  ]);

  const roleMap = new Map((rolesResult.data ?? []).map((item) => [item.user_id, item.role]));

  return (
    <div className="space-y-6">
      <PageHeader title="Gestión de usuarios" description="Crear usuarios y revisar estado de cuenta." />

      {context.clinicId ? (
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Invitar usuario</h2>
          <InviteUserForm clinicId={context.clinicId} />
        </Card>
      ) : null}

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Usuarios de la sede</h2>
        <ul className="space-y-2 text-sm">
          {(profilesResult.data ?? []).map((profile) => (
            <li key={profile.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
              <div>
                <p className="font-semibold text-slate-900">{profile.full_name}</p>
                <p className="text-slate-600">{profile.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{roleMap.get(profile.id) ?? "sin rol"}</Badge>
                <Badge tone={profile.active ? "success" : "danger"}>
                  {profile.active ? "activo" : "inactivo"}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
