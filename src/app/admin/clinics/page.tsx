import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";

export default async function AdminClinicsPage() {
  const context = await requireRole("admin");
  const supabase = await createClient();

  const { data: clinicsData } = await supabase
    .from("clinics")
    .select("id, name, address, phone, timezone, active")
    .order("created_at", { ascending: true });
  const clinics = clinicsData ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Gestión de sedes" description="CRUD de sedes. En MVP operativo: una sede activa." />

      <Card>
        <ul className="space-y-3 text-sm">
          {clinics.map((clinic) => (
            <li key={clinic.id} className="rounded-md border border-slate-200 p-3">
              <p className="font-semibold text-slate-900">{clinic.name}</p>
              <p className="text-slate-600">{clinic.address}</p>
              <p className="text-slate-600">
                {clinic.phone} | {clinic.timezone} | {clinic.active ? "activa" : "inactiva"}
              </p>
              {context.clinicId === clinic.id ? (
                <p className="mt-1 text-xs font-semibold text-cyan-700">Sede principal de tu cuenta</p>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
