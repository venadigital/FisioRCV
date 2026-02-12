import { NextResponse } from "next/server";
import { getApiUserContext } from "@/lib/auth/api";
import { createClient } from "@/lib/supabase/server";
import { painEventSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const context = await getApiUserContext();

  if (!context || context.role !== "patient") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = painEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Payload inválido" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("pain_events").insert({
    patient_id: context.userId,
    recorded_at: parsed.data.recordedAt ?? new Date().toISOString(),
    body_part: parsed.data.bodyPart,
    intensity: parsed.data.intensity,
    trigger: parsed.data.trigger,
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
