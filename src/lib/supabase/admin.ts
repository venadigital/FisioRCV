import { createClient } from "@supabase/supabase-js";

function resolveServiceRoleKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE ??
    ""
  );
}

export function createAdminClient() {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = resolveServiceRoleKey();

  if (!projectUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing service role key env (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY)");
  }

  if (serviceRoleKey === anonKey) {
    throw new Error("Service role key is invalid: it matches the anon key");
  }

  if (serviceRoleKey.startsWith("sb_publishable_")) {
    throw new Error("Service role key is invalid: publishable key provided");
  }

  return createClient(projectUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
