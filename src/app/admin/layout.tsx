import { RoleShell } from "@/components/layout/role-shell";
import { ADMIN_NAV } from "@/lib/constants";
import { requireRole } from "@/lib/auth/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const context = await requireRole("admin");

  return (
    <RoleShell
      title="Panel Admin"
      subtitle={context.fullName ? `Hola, ${context.fullName}` : "Gestión clínica"}
      nav={ADMIN_NAV}
    >
      {children}
    </RoleShell>
  );
}
