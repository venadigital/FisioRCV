import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUserContext } from "@/lib/auth/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminSetAssignmentsSchema } from "@/lib/validations";

const patientIdSchema = z.string().uuid("ID de paciente inválido");

function errorResponse(error: string, status: number, code: string) {
  return NextResponse.json({ error, code }, { status });
}

export async function PUT(request: Request, routeContext: { params: Promise<{ patientId: string }> }) {
  try {
    const context = await getApiUserContext();

    if (!context || context.role !== "admin") {
      return errorResponse("No autorizado", 403, "UNAUTHORIZED");
    }

    const params = await routeContext.params;
    const parsedPatientId = patientIdSchema.safeParse(params.patientId);

    if (!parsedPatientId.success) {
      return errorResponse(parsedPatientId.error.issues[0]?.message ?? "ID inválido", 400, "INVALID_PATIENT_ID");
    }

    const body = await request.json().catch(() => null);
    const parsedBody = adminSetAssignmentsSchema.safeParse(body);

    if (!parsedBody.success) {
      return errorResponse(parsedBody.error.issues[0]?.message ?? "Payload inválido", 400, "INVALID_PAYLOAD");
    }

    const patientId = parsedPatientId.data;
    const { clinicId, primaryTherapistId, secondaryTherapistIds } = parsedBody.data;

    if (context.clinicId && context.clinicId !== clinicId) {
      return errorResponse("No puedes asignar pacientes fuera de tu sede", 403, "CLINIC_FORBIDDEN");
    }

    const admin = createAdminClient();

    const [patientProfileResult, patientRoleResult] = await Promise.all([
      admin
        .from("profiles")
        .select("id, clinic_id")
        .eq("id", patientId)
        .maybeSingle(),
      admin
        .from("user_roles")
        .select("role")
        .eq("user_id", patientId)
        .maybeSingle(),
    ]);

    if (patientProfileResult.error || patientRoleResult.error) {
      return errorResponse(
        patientProfileResult.error?.message ?? patientRoleResult.error?.message ?? "No se pudo validar paciente",
        400,
        "PATIENT_VALIDATION_FAILED",
      );
    }

    if (!patientProfileResult.data || patientProfileResult.data.clinic_id !== clinicId) {
      return errorResponse("El paciente no pertenece a la sede indicada", 400, "PATIENT_CLINIC_MISMATCH");
    }

    if (!patientRoleResult.data || patientRoleResult.data.role !== "patient") {
      return errorResponse("El usuario seleccionado no es paciente", 400, "INVALID_PATIENT_ROLE");
    }

    const therapistIds = [primaryTherapistId, ...secondaryTherapistIds];

    const [therapistProfilesResult, therapistRolesResult] = await Promise.all([
      admin
        .from("profiles")
        .select("id, clinic_id, active")
        .in("id", therapistIds)
        .eq("clinic_id", clinicId),
      admin
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", therapistIds),
    ]);

    if (therapistProfilesResult.error || therapistRolesResult.error) {
      return errorResponse(
        therapistProfilesResult.error?.message ?? therapistRolesResult.error?.message ?? "No se pudo validar terapeutas",
        400,
        "THERAPIST_VALIDATION_FAILED",
      );
    }

    const therapistProfiles = therapistProfilesResult.data ?? [];
    const therapistRoleMap = new Map((therapistRolesResult.data ?? []).map((item) => [item.user_id, item.role]));

    if (therapistProfiles.length !== therapistIds.length) {
      return errorResponse("Uno o más terapeutas no pertenecen a la sede", 400, "THERAPIST_CLINIC_MISMATCH");
    }

    const hasInvalidTherapist = therapistProfiles.some(
      (therapist) => therapistRoleMap.get(therapist.id) !== "therapist" || !therapist.active,
    );

    if (hasInvalidTherapist) {
      return errorResponse(
        "Todos los asignados deben ser terapeutas activos de la sede",
        400,
        "INVALID_THERAPIST_SELECTION",
      );
    }

    const { error: deactivateError } = await admin
      .from("patient_assignments")
      .update({ active: false, is_primary: false })
      .eq("patient_id", patientId)
      .eq("clinic_id", clinicId)
      .eq("active", true);

    if (deactivateError) {
      return errorResponse(deactivateError.message, 400, "ASSIGNMENT_RESET_FAILED");
    }

    const payload = therapistIds.map((therapistId) => ({
      patient_id: patientId,
      therapist_id: therapistId,
      clinic_id: clinicId,
      active: true,
      is_primary: therapistId === primaryTherapistId,
    }));

    const { error: upsertError } = await admin
      .from("patient_assignments")
      .upsert(payload, { onConflict: "patient_id,therapist_id,clinic_id" });

    if (upsertError) {
      return errorResponse(upsertError.message, 400, "ASSIGNMENT_SAVE_FAILED");
    }

    return NextResponse.json({
      success: true,
      patientId,
      clinicId,
      primaryTherapistId,
      secondaryTherapistIds,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return errorResponse(message, 500, "INTERNAL_ERROR");
  }
}
