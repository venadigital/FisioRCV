import { NextResponse } from "next/server";
import { getApiUserContext } from "@/lib/auth/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviteUserSchema } from "@/lib/validations";

// Legacy route kept for backward compatibility.
export async function POST(request: Request) {
  try {
    const context = await getApiUserContext();

    if (!context || context.role !== "admin") {
      return NextResponse.json({ error: "No autorizado", code: "UNAUTHORIZED" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = inviteUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Payload inválido", code: "INVALID_PAYLOAD" },
        { status: 400 },
      );
    }

    const { email, role, fullName, phone, clinicId } = parsed.data;

    if (context.clinicId && context.clinicId !== clinicId) {
      return NextResponse.json(
        { error: "Solo puedes crear usuarios en tu sede", code: "CLINIC_FORBIDDEN" },
        { status: 403 },
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName,
        phone,
      },
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? "No se pudo invitar al usuario", code: "INVITE_FAILED" },
        { status: 400 },
      );
    }

    const profilePayload = {
      id: data.user.id,
      clinic_id: clinicId,
      full_name: fullName,
      phone,
      active: true,
    };

    const [profileInsert, roleInsert] = await Promise.all([
      admin.from("profiles").upsert(profilePayload),
      admin.from("user_roles").upsert({ user_id: data.user.id, role }),
    ]);

    if (profileInsert.error || roleInsert.error) {
      return NextResponse.json(
        {
          error: profileInsert.error?.message ?? roleInsert.error?.message ?? "Error guardando perfil",
          code: "PROFILE_SAVE_FAILED",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, userId: data.user.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: message, code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
