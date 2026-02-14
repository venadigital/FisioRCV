import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabasePublicConfig, resolveSupabaseAnonKey, resolveSupabaseUrl } from "@/lib/supabase/config";

export async function updateSession(request: NextRequest) {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.next({ request });
  }

  let nextResponse = NextResponse.next({
    request,
  });

  try {
    createServerClient(
      resolveSupabaseUrl(),
      resolveSupabaseAnonKey(),
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            nextResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              nextResponse.cookies.set(name, value, options),
            );
          },
        },
      },
    );
  } catch {
    return NextResponse.next({ request });
  }

  return nextResponse;
}
