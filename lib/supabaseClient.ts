import type { SupabaseClient } from "@supabase/supabase-js"

import { createSupabaseClient } from "@/lib/supabase"

export { createSupabaseClient, isSupabaseConfigured } from "@/lib/supabase"

export type SupabaseEnv = {
  url: string
  anonKey: string
}

export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!url || !anonKey) {
    return null
  }

  return { url, anonKey }
}

/** @deprecated Prefer createSupabaseClient() from @/lib/supabase */
export function getSupabaseClient(): SupabaseClient {
  return createSupabaseClient()
}
