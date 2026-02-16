import { NextResponse } from "next/server";
import { getApiUserContext } from "@/lib/auth/api";
import { roleHomePath } from "@/lib/utils";

function bearerTokenFromRequest(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization) return null;
  if (!authorization.toLowerCase().startsWith("bearer ")) return null;
  return authorization.slice(7).trim() || null;
}

export async function GET(request: Request) {
  const accessToken = bearerTokenFromRequest(request);
  const context = await getApiUserContext(accessToken ?? undefined);

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
