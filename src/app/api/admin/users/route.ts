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

    const { email, password, role, fullName, phone } = parsed.data;
    const clinicIds = role === "patient" ? (parsed.data.clinicIds ?? []) : [parsed.data.clinicId as string];
    const uniqueClinicIds = [...new Set(clinicIds)];

    if (uniqueClinicIds.length === 0) {
      return errorResponse("Debes enviar al menos una sede", 400, "CLINIC_REQUIRED");
    }

    if (context.clinicId && !uniqueClinicIds.includes(context.clinicId)) {
      return errorResponse("Debes incluir tu sede principal en la asignación", 403, "CLINIC_FORBIDDEN");
    }

    const admin = createAdminClient();

    const { data: clinicsData, error: clinicsError } = await admin
      .from("clinics")
      .select("id")
      .in("id", uniqueClinicIds);

    if (clinicsError) {
      return errorResponse(clinicsError.message, 400, "CLINIC_LOOKUP_FAILED");
    }

    if ((clinicsData ?? []).length !== uniqueClinicIds.length) {
      return errorResponse("Una o más sedes no existen", 404, "CLINIC_NOT_FOUND");
    }

    const primaryClinicId = context.clinicId && uniqueClinicIds.includes(context.clinicId) ? context.clinicId : uniqueClinicIds[0];

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
        .upsert({ id: userId, clinic_id: primaryClinicId, full_name: fullName, phone, active: true }),
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

    if (role === "patient") {
      const patientClinicsRows = uniqueClinicIds.map((assignedClinicId) => ({
        patient_id: userId,
        clinic_id: assignedClinicId,
        created_by: context.userId,
      }));

      const { error: patientClinicsError } = await admin.from("patient_clinics").insert(patientClinicsRows);

      if (patientClinicsError) {
        await admin.auth.admin.deleteUser(userId).catch(() => undefined);

        if (patientClinicsError.code === "42P01") {
          return errorResponse(
            "Falta la migración de patient_clinics en la base de datos de producción",
            500,
            "PATIENT_CLINICS_TABLE_MISSING",
          );
        }

        return errorResponse(patientClinicsError.message, 400, "PATIENT_CLINICS_SAVE_FAILED");
      }
    }

    return NextResponse.json({ success: true, userId, clinicIds: uniqueClinicIds });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return errorResponse(message, 500, "INTERNAL_ERROR");
  }
}
