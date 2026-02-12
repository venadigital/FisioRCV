import { NextResponse } from "next/server";
import { getApiUserContext } from "@/lib/auth/api";
import { createClient } from "@/lib/supabase/server";
import { exerciseCompletionSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const context = await getApiUserContext();

  if (!context || context.role !== "patient") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = exerciseCompletionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Payload inválido" }, { status: 400 });
  }

  const supabase = await createClient();

  const { error } = await supabase.from("exercise_completions").insert({
    plan_item_id: parsed.data.planItemId,
    patient_id: context.userId,
    completed_at: new Date().toISOString(),
    had_pain: parsed.data.hadPain,
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
