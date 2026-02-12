import { NextResponse } from "next/server";
import { getApiUserContext } from "@/lib/auth/api";
import { createClient } from "@/lib/supabase/server";
import { sessionNoteSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const context = await getApiUserContext();

  if (!context || (context.role !== "therapist" && context.role !== "admin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = sessionNoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Payload inválido" }, { status: 400 });
  }

  if (context.role === "therapist") {
    const supabase = await createClient();
    const { data: appointment } = await supabase
      .from("appointments")
      .select("id")
      .eq("id", parsed.data.appointmentId)
      .eq("therapist_id", context.userId)
      .maybeSingle();

    if (!appointment) {
      return NextResponse.json({ error: "No autorizado para esta cita" }, { status: 403 });
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.from("sessions").upsert(
    {
      appointment_id: parsed.data.appointmentId,
      patient_id: parsed.data.patientId,
      therapist_id: context.userId,
      session_date: parsed.data.sessionDate,
      notes: parsed.data.notes,
    },
    { onConflict: "appointment_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
