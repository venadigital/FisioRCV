import { createClient } from "@supabase/supabase-js";

const SERVICE_KEY_ENV_NAMES = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE",
  "SUPABASE_SERVICE_KEY",
] as const;

const MISSING_SERVICE_KEY_MESSAGE =
  "Missing service role key env (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY)";

const INVALID_SERVICE_KEY_MESSAGE = "Service role key is invalid";

function normalizeEnvValue(value: string | undefined) {
  return value?.trim() ?? "";
}

function resolveServiceRoleKey() {
  for (const envName of SERVICE_KEY_ENV_NAMES) {
    const value = normalizeEnvValue(process.env[envName]);
    if (value) {
      return value;
    }
  }

  return "";
}

export function getAdminRuntimeCheck() {
  const projectUrl = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL);
  const anonKey = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY);
  const serviceKey = resolveServiceRoleKey();

  const missing: string[] = [];

  if (!projectUrl) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!serviceKey) {
    missing.push("SUPABASE_SECRET_KEY");
  }

  if (serviceKey && anonKey && serviceKey === anonKey) {
    missing.push("SUPABASE_SECRET_KEY");
  }

  if (serviceKey && serviceKey.startsWith("sb_publishable_")) {
    missing.push("SUPABASE_SECRET_KEY");
  }

  return {
    canCreateUsers: missing.length === 0,
    missing: [...new Set(missing)],
  };
}

export function isMissingServiceRoleEnvError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error.message.includes(MISSING_SERVICE_KEY_MESSAGE);
}

export function isInvalidServiceRoleKeyError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error.message.includes(INVALID_SERVICE_KEY_MESSAGE);
}

export function createAdminClient() {
  const projectUrl = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL);
  const anonKey = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY);
  const serviceRoleKey = resolveServiceRoleKey();

  if (!projectUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!serviceRoleKey) {
    throw new Error(MISSING_SERVICE_KEY_MESSAGE);
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
