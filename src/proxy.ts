import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/", "/login", "/register", "/reset-password"];
const NO_CACHE_PATHS = new Set(["/login", "/reset-password"]);
const LOGIN_SENSITIVE_QUERY_KEYS = ["email", "password"];

function setNoCacheHeaders(response: NextResponse) {
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isNoCachePath = NO_CACHE_PATHS.has(path);

  if (path === "/login") {
    const cleanUrl = request.nextUrl.clone();
    let hasSensitiveQuery = false;

    for (const key of LOGIN_SENSITIVE_QUERY_KEYS) {
      if (cleanUrl.searchParams.has(key)) {
        hasSensitiveQuery = true;
        cleanUrl.searchParams.delete(key);
      }
    }

    if (hasSensitiveQuery) {
      const redirectResponse = NextResponse.redirect(cleanUrl);
      return isNoCachePath ? setNoCacheHeaders(redirectResponse) : redirectResponse;
    }
  }

  const response = await updateSession(request);

  const isProtectedPath =
    path.startsWith("/patient") || path.startsWith("/therapist") || path.startsWith("/admin");

  const isPublicPath = PUBLIC_PATHS.includes(path);

  if (!isProtectedPath && !isPublicPath) {
    return isNoCachePath ? setNoCacheHeaders(response) : response;
  }

  const hasSession = request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes("sb-") && cookie.name.endsWith("-auth-token"));

  if (isProtectedPath && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    const redirectResponse = NextResponse.redirect(url);
    return isNoCachePath ? setNoCacheHeaders(redirectResponse) : redirectResponse;
  }

  return isNoCachePath ? setNoCacheHeaders(response) : response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
