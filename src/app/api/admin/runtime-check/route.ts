import { NextResponse } from "next/server";
import { getApiUserContext } from "@/lib/auth/api";
import { getAdminRuntimeCheck } from "@/lib/supabase/admin";

export async function GET() {
  const context = await getApiUserContext();

  if (!context || context.role !== "admin") {
    return NextResponse.json({ error: "No autorizado", code: "UNAUTHORIZED" }, { status: 403 });
  }

  const check = getAdminRuntimeCheck();
  return NextResponse.json(check, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
