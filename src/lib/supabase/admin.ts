import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!projectUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  if (serviceRoleKey === anonKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is invalid: it matches the anon key");
  }

  if (serviceRoleKey.startsWith("sb_publishable_")) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is invalid: publishable key provided");
  }

  return createClient(projectUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
