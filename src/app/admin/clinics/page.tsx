import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";

function statusBadge(active: boolean) {
  if (active) {
    return <span className="rounded-full bg-[#dff4e5] px-3 py-1 text-2xl font-medium text-[#2a885b]">Activa</span>;
  }

  return <span className="rounded-full bg-slate-200 px-3 py-1 text-2xl font-medium text-slate-600">Inactiva</span>;
}

export default async function AdminClinicsPage() {
  const context = await requireRole("admin");
  const supabase = await createClient();

  const { data: clinicsData } = await supabase
    .from("clinics")
    .select("id, name, address, phone, timezone, active")
    .order("created_at", { ascending: true });

  const clinics = clinicsData ?? [];

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-7xl font-semibold tracking-tight text-[#111827]">Gestión de sedes</h1>
          <p className="mt-2 text-4xl text-slate-500">CRUD de sedes. En MVP operativo: una sede activa.</p>
        </div>

        <button className="h-14 rounded-xl bg-[#4f74bc] px-7 text-2xl font-semibold text-white hover:bg-[#4467ac]">
          + Añadir nueva sede
        </button>
      </header>

      {clinics.length === 0 ? (
        <Card className="rounded-2xl border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-3xl text-slate-500">No hay sedes registradas todavía.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {clinics.map((clinic) => (
            <Card key={clinic.id} className="rounded-2xl border-slate-200 bg-white p-0 shadow-sm">
              <div className="px-7 py-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="flex items-center gap-3 text-6xl font-semibold tracking-tight text-slate-900">
                      {clinic.name}
                      {statusBadge(Boolean(clinic.active))}
                    </h2>
                  </div>
                  <div className="flex items-center gap-5 pt-1 text-3xl text-slate-500">
                    <button className="rounded-lg p-2 hover:bg-slate-100">✎</button>
                    <button className="rounded-lg p-2 hover:bg-slate-100">⋮</button>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="space-y-3 text-4xl text-slate-500">
                    <p className="flex items-center gap-3">
                      <span className="text-2xl text-slate-400">⌖</span>
                      {clinic.address}
                    </p>
                    <p className="flex items-center gap-3">
                      <span className="text-2xl text-slate-400">◷</span>
                      {clinic.timezone}
                    </p>
                  </div>

                  <div className="space-y-3 text-4xl text-slate-500">
                    <p className="flex items-center gap-3">
                      <span className="text-2xl text-slate-400">☏</span>
                      {clinic.phone}
                    </p>
                    <p className="flex items-center gap-3">
                      <span className="text-2xl text-slate-400">✉</span>
                      Sin correo configurado
                    </p>
                  </div>
                </div>

                {context.clinicId === clinic.id ? (
                  <div className="mt-5 border-t border-slate-200 pt-5">
                    <p className="text-3xl font-medium text-[#3b62b2]">Sede principal de tu cuenta</p>
                  </div>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
