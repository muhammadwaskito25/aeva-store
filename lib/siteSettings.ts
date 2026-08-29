import { createSupabaseClient } from "@/lib/supabase"

export async function getSiteSettings(): Promise<Record<string, string>> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")

  if (error) {
    console.error("[settings] Error fetching settings:", error.message)
    return {}
  }

  const settings = (data ?? []).reduce((acc, curr) => {
    acc[curr.key] = String(curr.value)
    return acc
  }, {} as Record<string, string>)

  return settings
}

export async function getHeroSettings(): Promise<{ url: string; position: string }> {
  const settings = await getSiteSettings()
  return {
    url: settings.hero_image_url || "/hero.png",
    position: settings.hero_image_position || "center center",
  }
}
