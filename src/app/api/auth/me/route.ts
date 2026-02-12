import { NextResponse } from "next/server";
import { getApiUserContext } from "@/lib/auth/api";
import { roleHomePath } from "@/lib/utils";

export async function GET() {
  const context = await getApiUserContext();

  if (!context) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  return NextResponse.json({
    role: context.role,
    homePath: roleHomePath(context.role),
    clinicId: context.clinicId,
    fullName: context.fullName,
    email: context.email,
  });
}
