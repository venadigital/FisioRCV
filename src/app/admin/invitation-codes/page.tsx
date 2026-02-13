import { InvitationCodeForm } from "@/components/forms/invitation-code-form";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";

function formatDate(date: string | null) {
  if (!date) return "--";
  return new Date(date).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function usageTone(usedCount: number, maxUses: number) {
  const ratio = maxUses > 0 ? usedCount / maxUses : 0;

  if (ratio >= 1) {
    return { bar: "bg-slate-400", status: "expirado" as const };
  }

  if (ratio >= 0.8) {
    return { bar: "bg-amber-400", status: "alto" as const };
  }

  return { bar: "bg-[#87b7ae]", status: "normal" as const };
}

function statusTone(active: boolean, expiresAt: string | null, usedCount: number, maxUses: number) {
  const expiredByDate = Boolean(expiresAt && new Date(expiresAt).getTime() < Date.now());
  const exhausted = usedCount >= maxUses;

  if (!active || expiredByDate || exhausted) {
    return { label: "Expirado", classes: "bg-[#fee8e8] text-[#c45353]" };
  }

  return { label: "Activo", classes: "bg-[#e5f3eb] text-[#2f8a5f]" };
}

export default async function AdminInvitationCodesPage() {
  const context = await requireRole("admin");
  const supabase = await createClient();

  const { data: codesData } = await supabase
    .from("invitation_codes")
    .select("id, code, used_count, max_uses, expires_at, active, created_at")
    .eq("clinic_id", context.clinicId)
    .order("created_at", { ascending: false })
    .limit(50);

  const codes = codesData ?? [];
  const visibleCodes = codes.slice(0, 12);

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-5xl font-semibold tracking-tight text-[#111827]">Códigos de invitación</h1>
        <p className="mt-2 text-2xl text-slate-500">Generación, control de uso y expiración.</p>
      </header>

      {context.clinicId ? (
        <Card className="rounded-2xl border-slate-200 bg-white p-0 shadow-sm">
          <div className="p-8">
            <h2 className="mb-6 flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-800">
              <span className="text-[#0d7b97]">⊕</span>
              Generar código
            </h2>
            <InvitationCodeForm clinicId={context.clinicId} />
          </div>
        </Card>
      ) : null}

      <Card className="rounded-2xl border-slate-200 bg-white p-0 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6">
          <h2 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-800">
            <span className="text-[#0d7b97]">◔</span>
            Histórico de códigos
          </h2>
          <input
            placeholder="Buscar código..."
            className="h-12 w-80 rounded-xl border border-slate-300 px-4 text-xl text-slate-700 outline-none focus:ring-2 focus:ring-[#0d7b97]"
          />
        </div>

        <div className="overflow-x-auto px-8 py-5">
          <table className="min-w-full overflow-hidden rounded-xl border border-slate-200">
            <thead>
              <tr className="bg-[#f4f6f8] text-left text-xl font-semibold text-slate-500">
                <th className="px-5 py-4">CÓDIGO</th>
                <th className="px-5 py-4">CREADO</th>
                <th className="px-5 py-4">USO</th>
                <th className="px-5 py-4">EXPIRACIÓN</th>
                <th className="px-5 py-4">ESTADO</th>
                <th className="px-5 py-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {visibleCodes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-xl text-slate-500">
                    No hay códigos registrados.
                  </td>
                </tr>
              ) : (
                visibleCodes.map((code) => {
                  const usage = usageTone(code.used_count, code.max_uses);
                  const status = statusTone(code.active, code.expires_at, code.used_count, code.max_uses);
                  const ratio = code.max_uses > 0 ? Math.min((code.used_count / code.max_uses) * 100, 100) : 0;

                  return (
                    <tr key={code.id} className="border-t border-slate-200 text-xl text-slate-700">
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-full bg-[#e5f2f6] px-3 py-1 font-semibold text-[#0d7b97]">
                          {code.code}
                        </span>
                      </td>
                      <td className="px-5 py-4">{formatDate(code.created_at)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-28 overflow-hidden rounded-full bg-slate-200">
                            <div className={`h-full rounded-full ${usage.bar}`} style={{ width: `${ratio}%` }} />
                          </div>
                          <span>
                            {code.used_count}/{code.max_uses}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">{formatDate(code.expires_at)}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 font-medium ${status.classes}`}>{status.label}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">🗑</button>
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
            Mostrando 1 a {Math.min(visibleCodes.length, 12)} de {codes.length} resultados
          </p>
          <div className="flex items-center gap-3 text-base">
            <button className="rounded-xl border border-slate-300 px-5 py-2 text-slate-600">Anterior</button>
            <button className="rounded-xl border border-slate-300 px-5 py-2 text-slate-600">Siguiente</button>
          </div>
        </div>
      </Card>
    </div>
  );
}
