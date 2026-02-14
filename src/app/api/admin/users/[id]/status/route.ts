import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUserContext } from "@/lib/auth/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminUpdateUserStatusSchema } from "@/lib/validations";

const idSchema = z.string().uuid("ID de usuario inválido");

function errorResponse(error: string, status: number, code: string) {
  return NextResponse.json({ error, code }, { status });
}

export async function PATCH(request: Request, routeContext: { params: Promise<{ id: string }> }) {
  try {
    const context = await getApiUserContext();

    if (!context || context.role !== "admin") {
      return errorResponse("No autorizado", 403, "UNAUTHORIZED");
    }

    const params = await routeContext.params;
    const parsedId = idSchema.safeParse(params.id);

    if (!parsedId.success) {
      return errorResponse(parsedId.error.issues[0]?.message ?? "ID inválido", 400, "INVALID_USER_ID");
    }

    const body = await request.json().catch(() => null);
    const parsedBody = adminUpdateUserStatusSchema.safeParse(body);

    if (!parsedBody.success) {
      return errorResponse(parsedBody.error.issues[0]?.message ?? "Payload inválido", 400, "INVALID_PAYLOAD");
    }

    const userId = parsedId.data;
    const nextActive = parsedBody.data.active;

    if (!nextActive && context.userId === userId) {
      return errorResponse("No puedes desactivar tu propio usuario", 400, "SELF_DEACTIVATION_BLOCKED");
    }

    const admin = createAdminClient();

    const { data: targetProfile, error: targetProfileError } = await admin
      .from("profiles")
      .select("id, clinic_id, active")
      .eq("id", userId)
      .maybeSingle();

    if (targetProfileError) {
      return errorResponse(targetProfileError.message, 400, "PROFILE_LOOKUP_FAILED");
    }

    if (!targetProfile) {
      return errorResponse("Usuario no encontrado", 404, "USER_NOT_FOUND");
    }

    if (context.clinicId && context.clinicId !== targetProfile.clinic_id) {
      return errorResponse("No puedes operar usuarios de otra sede", 403, "CLINIC_FORBIDDEN");
    }

    const { data: roleData, error: roleError } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (roleError) {
      return errorResponse(roleError.message, 400, "ROLE_LOOKUP_FAILED");
    }

    if (!roleData) {
      return errorResponse("El usuario no tiene rol asignado", 400, "ROLE_NOT_FOUND");
    }

    if (!nextActive && roleData.role === "therapist") {
      const { data: activePrimaryAssignments, error: assignmentsError } = await admin
        .from("patient_assignments")
        .select("id")
        .eq("clinic_id", targetProfile.clinic_id)
        .eq("therapist_id", userId)
        .eq("active", true)
        .eq("is_primary", true)
        .limit(1);

      if (assignmentsError) {
        return errorResponse(assignmentsError.message, 400, "ASSIGNMENT_LOOKUP_FAILED");
      }

      if ((activePrimaryAssignments ?? []).length > 0) {
        return errorResponse(
          "No puedes desactivar este terapeuta porque tiene pacientes con asignación principal activa",
          409,
          "THERAPIST_HAS_PRIMARY_ASSIGNMENTS",
        );
      }
    }

    const { error: updateError } = await admin.from("profiles").update({ active: nextActive }).eq("id", userId);

    if (updateError) {
      return errorResponse(updateError.message, 400, "PROFILE_UPDATE_FAILED");
    }

    return NextResponse.json({ success: true, userId, active: nextActive });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return errorResponse(message, 500, "INTERNAL_ERROR");
  }
}
