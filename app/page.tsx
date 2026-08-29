import { HomePage } from "@/components/HomePage"
import { fetchFeaturedProducts } from "@/lib/products.repository"
import { getHeroSlides, getHomeSettings } from "@/lib/siteSettings"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function Page() {
  const [products, heroSlides, homeSettings] = await Promise.all([
    fetchFeaturedProducts(),
    getHeroSlides(),
    getHomeSettings(),
  ])

  console.log("[homepage] products loaded:", products.length)

  return <HomePage featuredProducts={products} heroSlides={heroSlides} settings={homeSettings} />
}
