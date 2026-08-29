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

export type HeroSlide = {
  id: string
  url: string
  position: string
}

export async function getHeroSlides(): Promise<HeroSlide[]> {
  const settings = await getSiteSettings()
  
  if (settings.hero_slides) {
    try {
      const parsed = JSON.parse(settings.hero_slides) as HeroSlide[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    } catch (e) {
      console.error("[settings] Error parsing hero_slides:", e)
    }
  }

  // Fallback to legacy single image if slides don't exist yet
  return [
    {
      id: "default-slide",
      url: settings.hero_image_url || "/hero.png",
      position: settings.hero_image_position || "center center",
    }
  ]
}
