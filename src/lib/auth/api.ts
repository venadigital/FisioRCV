import { createClient } from "@/lib/supabase/server";
import { AppRole, UserContext } from "@/lib/types";

export async function getApiUserContext(): Promise<UserContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [roleResult, profileResult] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("clinic_id, full_name, phone, active").eq("id", user.id).maybeSingle(),
  ]);

  const role = roleResult.data?.role as AppRole | undefined;
  const isActive = profileResult.data?.active ?? false;

  if (!role || !isActive) {
    return null;
  }

  return {
    userId: user.id,
    role,
    clinicId: profileResult.data?.clinic_id ?? null,
    fullName: profileResult.data?.full_name ?? null,
    phone: profileResult.data?.phone ?? null,
    email: user.email ?? null,
    active: true,
  };
}

export function isPrivilegedRole(role: AppRole) {
  return role === "admin" || role === "therapist";
}
