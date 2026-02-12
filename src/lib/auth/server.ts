import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppRole, UserContext } from "@/lib/types";
import { roleHomePath } from "@/lib/utils";

export async function getUserContext(): Promise<UserContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [profileResult, roleResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("clinic_id, full_name, phone")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const role = roleResult.data?.role as AppRole | undefined;

  if (!role) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    role,
    clinicId: profileResult.data?.clinic_id ?? null,
    fullName: profileResult.data?.full_name ?? null,
    phone: profileResult.data?.phone ?? null,
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
