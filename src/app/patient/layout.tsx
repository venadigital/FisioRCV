import { RoleShell } from "@/components/layout/role-shell";
import { PATIENT_NAV } from "@/lib/constants";
import { requireRole } from "@/lib/auth/server";

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const context = await requireRole("patient");

  return (
    <RoleShell
      title="Portal Paciente"
      subtitle={context.fullName ? `Hola, ${context.fullName}` : "Seguimiento clínico"}
      nav={PATIENT_NAV}
    >
      {children}
    </RoleShell>
  );
}
