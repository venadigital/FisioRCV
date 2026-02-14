export function resolveSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
}

export function resolveSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
}

export function hasSupabasePublicConfig() {
  return Boolean(resolveSupabaseUrl() && resolveSupabaseAnonKey());
}
