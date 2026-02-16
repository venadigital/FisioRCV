import { createClient } from "@/lib/supabase/server";
import { AppRole, UserContext } from "@/lib/types";
import { resolveSupabaseAnonKey, resolveSupabaseUrl } from "@/lib/supabase/config";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

type UserShape = { id: string; email?: string | null } | null;
type ProfileShape = {
  clinic_id?: string | null;
  full_name?: string | null;
  phone?: string | null;
  active?: boolean;
} | null;
type RoleShape = { role?: AppRole } | null;

type SingleResult<T> = Promise<{ data: T; error: unknown }>;

type ContextClient = {
  auth: {
    getUser: (jwt?: string) => Promise<{
      data: { user: UserShape };
      error: unknown;
    }>;
  };
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => SingleResult<unknown>;
      };
    };
  };
};

async function buildContextWithClient(
  supabase: ContextClient,
  accessToken?: string,
): Promise<UserContext | null> {
  const {
    data: { user },
  } = accessToken ? await supabase.auth.getUser(accessToken) : await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [roleResult, profileResult] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("clinic_id, full_name, phone, active").eq("id", user.id).maybeSingle(),
  ]);

  const roleData = roleResult.data as RoleShape;
  const profileData = profileResult.data as ProfileShape;

  const role = roleData?.role as AppRole | undefined;
  const isActive = profileData?.active ?? false;

  if (!role || !isActive) {
    return null;
  }

  return {
    userId: user.id,
    role,
    clinicId: profileData?.clinic_id ?? null,
    fullName: profileData?.full_name ?? null,
    phone: profileData?.phone ?? null,
    email: user.email ?? null,
    active: true,
  };
}

export async function getApiUserContext(accessToken?: string): Promise<UserContext | null> {
  if (accessToken) {
    const supabaseUrl = resolveSupabaseUrl();
    const supabaseAnonKey = resolveSupabaseAnonKey();

    if (!supabaseUrl || !supabaseAnonKey) {
      return null;
    }

    const tokenClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    return buildContextWithClient(tokenClient as unknown as ContextClient, accessToken);
  }

  const supabase = await createClient();
  return buildContextWithClient(supabase as unknown as ContextClient);
}

export function isPrivilegedRole(role: AppRole) {
  return role === "admin" || role === "therapist";
}
