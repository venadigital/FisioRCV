import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUserContext } from "@/lib/auth/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminUpdateClinicSchema } from "@/lib/validations";

const idSchema = z.string().uuid("ID de sede inválido");

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
      return errorResponse(parsedId.error.issues[0]?.message ?? "ID inválido", 400, "INVALID_CLINIC_ID");
    }

    const body = await request.json().catch(() => null);
    const parsedBody = adminUpdateClinicSchema.safeParse(body);

    if (!parsedBody.success) {
      return errorResponse(parsedBody.error.issues[0]?.message ?? "Payload inválido", 400, "INVALID_PAYLOAD");
    }

    const clinicId = parsedId.data;
    const admin = createAdminClient();

    const { data: clinicData, error: clinicLookupError } = await admin
      .from("clinics")
      .select("id")
      .eq("id", clinicId)
      .maybeSingle();

    if (clinicLookupError) {
      return errorResponse(clinicLookupError.message, 400, "CLINIC_LOOKUP_FAILED");
    }

    if (!clinicData) {
      return errorResponse("La sede no existe", 404, "CLINIC_NOT_FOUND");
    }

    const { data, error } = await admin
      .from("clinics")
      .update(parsedBody.data)
      .eq("id", clinicId)
      .select("id, name, address, phone, timezone, active")
      .single();

    if (error) {
      return errorResponse(error.message, 400, "CLINIC_UPDATE_FAILED");
    }

    return NextResponse.json({ success: true, clinic: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return errorResponse(message, 500, "INTERNAL_ERROR");
  }
}
