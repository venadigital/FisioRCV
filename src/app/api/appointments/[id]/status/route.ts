import { NextResponse } from "next/server";
import { getApiUserContext, isPrivilegedRole } from "@/lib/auth/api";
import { createClient } from "@/lib/supabase/server";
import { appointmentStatusSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getApiUserContext();

  if (!user || !isPrivilegedRole(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = appointmentStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Payload inválido" }, { status: 400 });
  }

  const { id } = await context.params;
  const supabase = await createClient();

  if (user.role === "therapist") {
    const { data: ownAppointment } = await supabase
      .from("appointments")
      .select("id")
      .eq("id", id)
      .eq("therapist_id", user.userId)
      .maybeSingle();

    if (!ownAppointment) {
      return NextResponse.json({ error: "No autorizado para esta cita" }, { status: 403 });
    }
  }

  const { error } = await supabase.from("appointments").update({ status: parsed.data.status }).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
