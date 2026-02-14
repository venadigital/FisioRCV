import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppRole, UserContext } from "@/lib/types";
import { roleHomePath } from "@/lib/utils";

export async function getUserContext(): Promise<UserContext | null> {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return null;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [profileResult, roleResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("clinic_id, full_name, phone, active")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const role = roleResult.data?.role as AppRole | undefined;
  const isActive = profileResult.data?.active ?? false;

  if (!role || !isActive) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    role,
    clinicId: profileResult.data?.clinic_id ?? null,
    fullName: profileResult.data?.full_name ?? null,
    phone: profileResult.data?.phone ?? null,
    active: true,
  };
}

export async function requireUser() {
  const context = await getUserContext();
  if (!context) {
    redirect("/login");
  }
  return context;
}

export async function requireRole(expectedRole: AppRole) {
  const context = await requireUser();

  if (context.role !== expectedRole) {
    redirect(roleHomePath(context.role));
  }

  return context;
}
