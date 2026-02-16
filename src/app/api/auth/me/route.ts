import { NextResponse } from "next/server";
import { getApiUserContext } from "@/lib/auth/api";
import { roleHomePath } from "@/lib/utils";
import { resolveSupabaseAnonKey, resolveSupabaseUrl } from "@/lib/supabase/config";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppRole } from "@/lib/types";

function requestMeta(request: Request) {
  const url = new URL(request.url);
  const requestId =
    request.headers.get("x-hcdn-request-id") ??
    request.headers.get("x-request-id") ??
    request.headers.get("cf-ray") ??
    "unknown";

  return {
    path: url.pathname,
    requestId,
  };
}

function logAuthMeError(request: Request, stage: string, error?: unknown) {
  const meta = requestMeta(request);
  const message = error instanceof Error ? error.message : String(error ?? "unknown_error");

  console.error("[auth/me]", {
    stage,
    path: meta.path,
    requestId: meta.requestId,
    error: message,
  });
}

function jsonResponse(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

function bearerTokenFromRequest(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization) return null;
  if (!authorization.toLowerCase().startsWith("bearer ")) return null;
  return authorization.slice(7).trim() || null;
}

export async function GET(request: Request) {
  try {
    const accessToken = bearerTokenFromRequest(request);

    if (accessToken) {
      const supabaseUrl = resolveSupabaseUrl();
      const supabaseAnonKey = resolveSupabaseAnonKey();

      if (!supabaseUrl || !supabaseAnonKey) {
        logAuthMeError(request, "missing_supabase_public_config");
        return jsonResponse({ error: "Configuración de Supabase incompleta" }, 500);
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
        logAuthMeError(request, "token_auth_failed", tokenError?.message);
        return jsonResponse({ error: "No autenticado" }, 401);
      }

      const [roleResultWithToken, profileResultWithToken] = await Promise.all([
        tokenClient.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
        tokenClient
          .from("profiles")
          .select("clinic_id, full_name, phone, active")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

      let roleResult = roleResultWithToken;
      let profileResult = profileResultWithToken;

      if (roleResult.error || profileResult.error) {
        try {
          const admin = createAdminClient();
          const [roleResultWithAdmin, profileResultWithAdmin] = await Promise.all([
            admin.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
            admin
              .from("profiles")
              .select("clinic_id, full_name, phone, active")
              .eq("id", user.id)
              .maybeSingle(),
          ]);

          roleResult = roleResultWithAdmin;
          profileResult = profileResultWithAdmin;
        } catch (fallbackError) {
          logAuthMeError(request, "admin_fallback_failed", fallbackError);
          // Ignore fallback failure, token query errors are handled below.
        }
      }

      if (roleResult.error) {
        logAuthMeError(request, "role_query_failed", roleResult.error.message);
        return jsonResponse({ error: "No se pudo cargar el rol del usuario" }, 500);
      }

      const role = roleResult.data?.role as AppRole | undefined;
      if (!role) {
        logAuthMeError(request, "role_missing");
        return jsonResponse({ error: "Tu cuenta no tiene rol asignado" }, 403);
      }

      if (profileResult.error) {
        logAuthMeError(request, "profile_query_failed", profileResult.error.message);
        return jsonResponse({ error: "No se pudo cargar el perfil del usuario" }, 500);
      }

      if (!profileResult.data) {
        logAuthMeError(request, "profile_missing");
        return jsonResponse({ error: "Tu cuenta no tiene perfil clínico" }, 403);
      }

      if (!profileResult.data.active) {
        logAuthMeError(request, "profile_inactive");
        return jsonResponse({ error: "Tu cuenta está inactiva. Contacta al administrador." }, 403);
      }

      return jsonResponse({
        role,
        homePath: roleHomePath(role),
        clinicId: profileResult.data.clinic_id,
        fullName: profileResult.data.full_name,
        email: user.email ?? null,
      });
    }

    const context = await getApiUserContext();

    if (!context) {
      logAuthMeError(request, "no_context_session");
      return jsonResponse({ error: "No autenticado" }, 401);
    }

    return jsonResponse({
      role: context.role,
      homePath: roleHomePath(context.role),
      clinicId: context.clinicId,
      fullName: context.fullName,
      email: context.email,
    });
  } catch (error) {
    logAuthMeError(request, "unexpected_exception", error);
    return jsonResponse({ error: "Error interno al validar sesión" }, 500);
  }
}
