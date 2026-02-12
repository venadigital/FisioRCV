import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { patientRegisterSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = patientRegisterSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Payload inválido" }, { status: 400 });
  }

  const { fullName, email, phone, password, invitationCode } = parsed.data;
  const admin = createAdminClient();

  const validationResult = await admin.rpc("validate_invitation_code", { _code: invitationCode }).single();
  const validationError = validationResult.error;
  const validationData = validationResult.data as
    | { valid: boolean; clinic_id: string | null; reason: string | null }
    | null;

  if (validationError) {
    return NextResponse.json({ error: validationError.message }, { status: 400 });
  }

  if (!validationData?.valid || !validationData.clinic_id) {
    return NextResponse.json({ error: validationData?.reason ?? "Código inválido" }, { status: 400 });
  }

  const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createUserError || !createdUser.user) {
    return NextResponse.json({ error: createUserError?.message ?? "No se pudo crear el usuario" }, { status: 400 });
  }

  const { error: consumeError } = await admin.rpc("consume_invitation_code_and_create_patient_for_user", {
    _code: invitationCode,
    _user_id: createdUser.user.id,
    _full_name: fullName,
    _phone: phone,
  });

  if (consumeError) {
    await admin.auth.admin.deleteUser(createdUser.user.id);
    return NextResponse.json({ error: consumeError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
