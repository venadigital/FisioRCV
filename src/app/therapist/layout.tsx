import { RoleShell } from "@/components/layout/role-shell";
import { THERAPIST_NAV } from "@/lib/constants";
import { requireRole } from "@/lib/auth/server";

export default async function TherapistLayout({ children }: { children: React.ReactNode }) {
  const context = await requireRole("therapist");

  return (
    <RoleShell
      title="Portal Fisioterapeuta"
      subtitle={context.fullName ? `Hola, ${context.fullName}` : "Panel clínico"}
      nav={THERAPIST_NAV}
    >
      {children}
    </RoleShell>
  );
}
