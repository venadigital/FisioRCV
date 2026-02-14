import { NextResponse } from "next/server";
import { getApiUserContext } from "@/lib/auth/api";
import { createClient } from "@/lib/supabase/server";
import { createInvitationCodeSchema } from "@/lib/validations";
import { randomCode } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const context = await getApiUserContext();

    if (!context || context.role !== "admin") {
      return NextResponse.json({ error: "No autorizado", code: "UNAUTHORIZED" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = createInvitationCodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Payload inválido", code: "INVALID_PAYLOAD" },
        { status: 400 },
      );
    }

    if (context.clinicId && context.clinicId !== parsed.data.clinicId) {
      return NextResponse.json(
        { error: "No puedes generar códigos para otra sede", code: "CLINIC_FORBIDDEN" },
        { status: 403 },
      );
    }

    const supabase = await createClient();

    const payload = {
      code: randomCode(8),
      clinic_id: parsed.data.clinicId,
      max_uses: parsed.data.maxUses,
      expires_at: parsed.data.expiresAt ?? null,
      active: true,
      created_by: context.userId,
    };

    const { data, error } = await supabase.from("invitation_codes").insert(payload).select("id, code").single();

    if (error) {
      return NextResponse.json({ error: error.message, code: "CREATE_FAILED" }, { status: 400 });
    }

    return NextResponse.json({ success: true, invitationCode: data.code, id: data.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: message, code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
