import { NextResponse } from "next/server";
import { getApiUserContext } from "@/lib/auth/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminCreateUserSchema } from "@/lib/validations";

function errorResponse(error: string, status: number, code: string) {
  return NextResponse.json({ error, code }, { status });
}

export async function POST(request: Request) {
  try {
    const context = await getApiUserContext();

    if (!context || context.role !== "admin") {
      return errorResponse("No autorizado", 403, "UNAUTHORIZED");
    }

    const body = await request.json().catch(() => null);
    const parsed = adminCreateUserSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? "Payload inválido", 400, "INVALID_PAYLOAD");
    }

    const { email, password, role, fullName, phone, clinicId } = parsed.data;

    if (context.clinicId && context.clinicId !== clinicId) {
      return errorResponse("Solo puedes crear usuarios en tu sede", 403, "CLINIC_FORBIDDEN");
    }

    const admin = createAdminClient();

    const { data: clinicData, error: clinicError } = await admin
      .from("clinics")
      .select("id")
      .eq("id", clinicId)
      .maybeSingle();

    if (clinicError) {
      return errorResponse(clinicError.message, 400, "CLINIC_LOOKUP_FAILED");
    }

    if (!clinicData) {
      return errorResponse("La sede no existe", 404, "CLINIC_NOT_FOUND");
    }

    const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone,
      },
    });

    if (createUserError || !createdUser.user) {
      const message = createUserError?.message?.toLowerCase().includes("already")
        ? "El correo ya está registrado"
        : createUserError?.message ?? "No se pudo crear el usuario";

      return errorResponse(message, 400, "AUTH_CREATE_FAILED");
    }

    const userId = createdUser.user.id;

    const [profileInsert, roleInsert] = await Promise.all([
      admin
        .from("profiles")
        .upsert({ id: userId, clinic_id: clinicId, full_name: fullName, phone, active: true }),
      admin.from("user_roles").upsert({ user_id: userId, role }),
    ]);

    if (profileInsert.error || roleInsert.error) {
      await admin.auth.admin.deleteUser(userId).catch(() => undefined);

      return errorResponse(
        profileInsert.error?.message ?? roleInsert.error?.message ?? "No se pudo guardar el perfil",
        400,
        "PROFILE_SAVE_FAILED",
      );
    }

    return NextResponse.json({ success: true, userId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return errorResponse(message, 500, "INTERNAL_ERROR");
  }
}
