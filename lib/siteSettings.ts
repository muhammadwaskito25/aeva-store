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

export type HomeSettings = {
  home_hero_subtitle: string
  home_hero_title: string
  home_hero_text: string
  home_featured_subtitle: string
  home_featured_title: string
  home_featured_text: string
}

export async function getHomeSettings(): Promise<HomeSettings> {
  const settings = await getSiteSettings()
  
  return {
    home_hero_subtitle: settings.home_hero_subtitle || "Solids Viscose Series",
    home_hero_title: settings.home_hero_title || "Quiet Luxury,\nGentle Drape",
    home_hero_text: settings.home_hero_text || "A curated line of refined, soft scarves and modestwear essentials crafted for understated elegance in daily rituals.",
    home_featured_subtitle: settings.home_featured_subtitle || "SOLIDS VISCOSE COLLECTION",
    home_featured_title: settings.home_featured_title || "Featured Pieces",
    home_featured_text: settings.home_featured_text || "Timeless silhouettes designed in a soft neutral palette to layer and mix seamlessly.",
  }
}

export type AboutValue = {
  id: string
  title: string
  description: string
  icon: string
}

export type AboutLookbook = {
  id: string
  url: string
  alt: string
}

export type AboutTestimonial = {
  id: string
  quote: string
  name: string
  location: string
}

export type AboutSettings = {
  about_hero_image: string
  about_hero_title: string
  about_hero_text: string
  about_story_image: string
  about_story_title: string
  about_story_text: string
  about_values: AboutValue[]
  about_lookbook: AboutLookbook[]
  about_testimonials: AboutTestimonial[]
}

export async function getAboutSettings(): Promise<AboutSettings> {
  const settings = await getSiteSettings()

  const safeParseJSON = <T>(str: string | undefined, fallback: T): T => {
    if (!str) return fallback
    try {
      return JSON.parse(str) as T
    } catch {
      return fallback
    }
  }

  // Fallbacks based on previous hardcoded values
  const defaultValues: AboutValue[] = [
    { id: "v1", title: "Timeless Design", description: "Silhouettes that transcend seasons — restrained, intentional, and made to feel relevant for years.", icon: "Sparkles" },
    { id: "v2", title: "Soft Comfort", description: "Refined fabrics chosen for gentle drape and breathable wear, elevating everyday movement.", icon: "Feather" },
    { id: "v3", title: "Everyday Elegance", description: "Quiet luxury for modern modestwear — polished enough for occasion, effortless for daily life.", icon: "Sun" },
  ]

  const defaultLookbook: AboutLookbook[] = [
    { id: "lb1", url: "/hero.png", alt: "AÉVA editorial — neutral tones" },
    { id: "lb2", url: "/about2.jpg", alt: "Silk drape detail" },
    { id: "lb3", url: "/about3.jpg", alt: "Soft fold styling" },
  ]

  const defaultTestimonials: AboutTestimonial[] = [
    { id: "t1", quote: "AÉVA scarves feel incredibly refined. The fabric is light, graceful, and elevates every outfit.", name: "Mina K.", location: "Seoul" },
    { id: "t2", quote: "Minimal, elegant, and timeless. This is exactly the quiet luxury look I wanted.", name: "Aiko T.", location: "Tokyo" },
  ]
  
  return {
    about_hero_image: settings.about_hero_image || "/about4.jpg",
    about_hero_title: settings.about_hero_title || "Crafted for\nQuiet Elegance",
    about_hero_text: settings.about_hero_text || "AÉVA crafts refined scarves for modern women who value softness, simplicity, and timeless drape. Founded by women, for women — every scarf is a quiet declaration of strength, grace, and the freedom to wear on your own terms.",
    about_story_image: settings.about_story_image || "/about.png",
    about_story_title: settings.about_story_title || "An effortless presence",
    about_story_text: settings.about_story_text || "AÉVA was born from a simple belief — that scarves should feel timeless, effortless, and made for every woman. We wanted to create pieces that are easy to wear, soft in presence, and naturally elegant without feeling excessive.\n\nThrough refined fabrics, neutral tones, and thoughtful simplicity, each scarf is designed to become a part of everyday moments — comfortable, versatile, and quietly beautiful.\n\nMade for every woman, every style, and every season.",
    about_values: safeParseJSON<AboutValue[]>(settings.about_values, defaultValues),
    about_lookbook: safeParseJSON<AboutLookbook[]>(settings.about_lookbook, defaultLookbook),
    about_testimonials: safeParseJSON<AboutTestimonial[]>(settings.about_testimonials, defaultTestimonials),
  }
}
