import { AdminShell } from "@/components/layout/admin-shell";
import { ADMIN_NAV } from "@/lib/constants";
import { requireRole } from "@/lib/auth/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const context = await requireRole("admin");

  return (
    <AdminShell subtitle={context.fullName ? `Hola, ${context.fullName}` : "Gestión clínica"} nav={ADMIN_NAV}>
      {children}
    </AdminShell>
  );
}
