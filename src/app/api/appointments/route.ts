import { NextResponse } from "next/server";
import { getApiUserContext, isPrivilegedRole } from "@/lib/auth/api";
import { createClient } from "@/lib/supabase/server";
import { createAppointmentSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const context = await getApiUserContext();

  if (!context || !isPrivilegedRole(context.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createAppointmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Payload inválido" }, { status: 400 });
  }

  if (context.clinicId && context.clinicId !== parsed.data.clinicId) {
    return NextResponse.json({ error: "Sede fuera de tu alcance" }, { status: 403 });
  }

  if (context.role === "therapist" && context.userId !== parsed.data.therapistId) {
    return NextResponse.json({ error: "Un terapeuta solo puede crear sus propias citas" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      patient_id: parsed.data.patientId,
      therapist_id: parsed.data.therapistId,
      clinic_id: parsed.data.clinicId,
      scheduled_at: parsed.data.scheduledAtUtc,
      duration_minutes: 30,
      status: "scheduled",
    })
    .select("id")
    .single();

  if (error) {
    const message = error.code === "23P01" ? "La cita se solapa con otra existente" : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ success: true, id: data.id });
}
