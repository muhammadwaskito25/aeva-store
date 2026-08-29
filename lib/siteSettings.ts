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

export type AboutSettings = {
  about_hero_image: string
  about_hero_title: string
  about_hero_text: string
  about_story_image: string
  about_story_title: string
  about_story_text: string
}

export async function getAboutSettings(): Promise<AboutSettings> {
  const settings = await getSiteSettings()
  
  return {
    about_hero_image: settings.about_hero_image || "/about4.jpg",
    about_hero_title: settings.about_hero_title || "Crafted for\nQuiet Elegance",
    about_hero_text: settings.about_hero_text || "AÉVA crafts refined scarves for modern women who value softness, simplicity, and timeless drape. Founded by women, for women — every scarf is a quiet declaration of strength, grace, and the freedom to wear on your own terms.",
    about_story_image: settings.about_story_image || "/about.png",
    about_story_title: settings.about_story_title || "An effortless presence",
    about_story_text: settings.about_story_text || "AÉVA was born from a simple belief — that scarves should feel timeless, effortless, and made for every woman. We wanted to create pieces that are easy to wear, soft in presence, and naturally elegant without feeling excessive.\n\nThrough refined fabrics, neutral tones, and thoughtful simplicity, each scarf is designed to become a part of everyday moments — comfortable, versatile, and quietly beautiful.\n\nMade for every woman, every style, and every season.",
  }
}
