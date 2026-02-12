import { NextResponse } from "next/server";
import { getApiUserContext } from "@/lib/auth/api";
import { createClient } from "@/lib/supabase/server";
import { therapistExerciseSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const context = await getApiUserContext();

  if (!context || (context.role !== "therapist" && context.role !== "admin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = therapistExerciseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Payload inválido" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("exercises").insert({
    clinic_id: context.clinicId,
    created_by: context.userId,
    name: parsed.data.name,
    youtube_url: parsed.data.youtubeUrl,
    instructions: parsed.data.instructions,
    series: parsed.data.series,
    reps: parsed.data.reps,
    frequency_per_week: parsed.data.frequencyPerWeek,
    category: parsed.data.category,
    body_part: parsed.data.bodyPart,
    difficulty: parsed.data.difficulty,
    active: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
