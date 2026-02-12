import { AdminShell } from "@/components/layout/admin-shell";
import { ADMIN_NAV } from "@/lib/constants";
import { requireRole } from "@/lib/auth/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const context = await requireRole("admin");

  return (
    <AdminShell fullName={context.fullName} nav={ADMIN_NAV}>
      {children}
    </AdminShell>
  );
}
