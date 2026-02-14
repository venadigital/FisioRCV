import { NextResponse } from "next/server";
import { getApiUserContext } from "@/lib/auth/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminCreateClinicSchema } from "@/lib/validations";

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
    const parsed = adminCreateClinicSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? "Payload inválido", 400, "INVALID_PAYLOAD");
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("clinics")
      .insert({
        name: parsed.data.name,
        address: parsed.data.address,
        phone: parsed.data.phone,
        timezone: parsed.data.timezone,
        active: parsed.data.active,
      })
      .select("id, name, address, phone, timezone, active")
      .single();

    if (error) {
      return errorResponse(error.message, 400, "CLINIC_CREATE_FAILED");
    }

    return NextResponse.json({ success: true, clinic: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return errorResponse(message, 500, "INTERNAL_ERROR");
  }
}
