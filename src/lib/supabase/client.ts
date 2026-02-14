"use client";

import { createBrowserClient } from "@supabase/ssr";
import { resolveSupabaseAnonKey, resolveSupabaseUrl } from "@/lib/supabase/config";

export function createClient() {
  const supabaseUrl = resolveSupabaseUrl();
  const supabaseAnonKey = resolveSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase public config");
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
  );
}
