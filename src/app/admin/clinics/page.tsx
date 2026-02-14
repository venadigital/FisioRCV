import { AdminClinicsManager } from "@/components/forms/admin-clinics-manager";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";

export default async function AdminClinicsPage() {
  const context = await requireRole("admin");
  const supabase = await createClient();

  const { data: clinicsData } = await supabase
    .from("clinics")
    .select("id, name, address, phone, timezone, active")
    .order("created_at", { ascending: true });

  const clinics = (clinicsData ?? []).map((clinic) => ({
    id: clinic.id,
    name: clinic.name,
    address: clinic.address,
    phone: clinic.phone,
    timezone: clinic.timezone,
    active: clinic.active,
  }));

  return <AdminClinicsManager clinics={clinics} currentClinicId={context.clinicId} />;
}
