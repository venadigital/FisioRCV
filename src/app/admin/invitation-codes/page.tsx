import { InvitationCodeForm } from "@/components/forms/invitation-code-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";

export default async function AdminInvitationCodesPage() {
  const context = await requireRole("admin");
  const supabase = await createClient();

  const { data: codesData } = await supabase
    .from("invitation_codes")
    .select("id, code, used_count, max_uses, expires_at, active")
    .eq("clinic_id", context.clinicId)
    .order("created_at", { ascending: false })
    .limit(50);
  const codes = codesData ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Códigos de invitación" description="Generación, control de uso y expiración." />

      {context.clinicId ? (
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Generar código</h2>
          <InvitationCodeForm clinicId={context.clinicId} />
        </Card>
      ) : null}

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Histórico de códigos</h2>
        <ul className="space-y-2 text-sm">
          {codes.map((code) => (
            <li key={code.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
              <div>
                <p className="font-semibold text-slate-900">{code.code}</p>
                <p className="text-slate-600">
                  Uso: {code.used_count}/{code.max_uses}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={code.active ? "success" : "danger"}>
                  {code.active ? "activo" : "inactivo"}
                </Badge>
                <Badge>{code.expires_at ? new Date(code.expires_at).toLocaleDateString("es-MX") : "sin exp."}</Badge>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
