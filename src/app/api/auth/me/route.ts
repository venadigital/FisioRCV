import { NextResponse } from "next/server";
import { getApiUserContext } from "@/lib/auth/api";
import { roleHomePath } from "@/lib/utils";
import { resolveSupabaseAnonKey, resolveSupabaseUrl } from "@/lib/supabase/config";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppRole } from "@/lib/types";

function bearerTokenFromRequest(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization) return null;
  if (!authorization.toLowerCase().startsWith("bearer ")) return null;
  return authorization.slice(7).trim() || null;
}

export async function GET(request: Request) {
  const accessToken = bearerTokenFromRequest(request);

  if (accessToken) {
    const supabaseUrl = resolveSupabaseUrl();
    const supabaseAnonKey = resolveSupabaseAnonKey();

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Configuración de Supabase incompleta" }, { status: 500 });
    }

    const tokenClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    const {
      data: { user },
      error: tokenError,
    } = await tokenClient.auth.getUser(accessToken);

    if (tokenError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    try {
      const admin = createAdminClient();

      const [roleResult, profileResult] = await Promise.all([
        admin.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
        admin.from("profiles").select("clinic_id, full_name, phone, active").eq("id", user.id).maybeSingle(),
      ]);

      if (roleResult.error) {
        return NextResponse.json({ error: "No se pudo cargar el rol del usuario" }, { status: 500 });
      }

      const role = roleResult.data?.role as AppRole | undefined;
      if (!role) {
        return NextResponse.json({ error: "Tu cuenta no tiene rol asignado" }, { status: 403 });
      }

      if (profileResult.error) {
        return NextResponse.json({ error: "No se pudo cargar el perfil del usuario" }, { status: 500 });
      }

      if (!profileResult.data) {
        return NextResponse.json({ error: "Tu cuenta no tiene perfil clínico" }, { status: 403 });
      }

      if (!profileResult.data.active) {
        return NextResponse.json({ error: "Tu cuenta está inactiva. Contacta al administrador." }, { status: 403 });
      }

      return NextResponse.json({
        role,
        homePath: roleHomePath(role),
        clinicId: profileResult.data.clinic_id,
        fullName: profileResult.data.full_name,
        email: user.email ?? null,
      });
    } catch {
      return NextResponse.json({ error: "Error interno al validar sesión" }, { status: 500 });
    }
  }

  const context = await getApiUserContext();

  if (!context) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  return NextResponse.json({
    role: context.role,
    homePath: roleHomePath(context.role),
    clinicId: context.clinicId,
    fullName: context.fullName,
    email: context.email,
  });
}
