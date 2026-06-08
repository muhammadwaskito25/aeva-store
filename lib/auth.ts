import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"

export type UserProfile = {
  id: string
  full_name: string | null
  updated_at: string
}

/** Get the currently authenticated Supabase user (server-side). Returns null if not authenticated. */
export async function getUser(): Promise<User | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user ?? null
  } catch {
    return null
  }
}

/** Fetch the customer profile row. Creates one if it doesn't exist. */
export async function getOrCreateProfile(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = await createSupabaseServerClient()

    // Try to fetch existing profile
    const { data: existing } = await supabase
      .from("profiles")
      .select("id, full_name, updated_at")
      .eq("id", userId)
      .maybeSingle()

    if (existing) return existing as UserProfile

    // Create profile if missing (e.g. first OAuth login)
    const { data: created } = await supabase
      .from("profiles")
      .insert({ id: userId, full_name: null })
      .select("id, full_name, updated_at")
      .single()

    return (created as UserProfile) ?? null
  } catch {
    return null
  }
}
