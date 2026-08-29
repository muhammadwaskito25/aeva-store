import { HomePage } from "@/components/HomePage"
import { fetchFeaturedProducts } from "@/lib/products.repository"
import { getHeroSettings } from "@/lib/siteSettings"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function Page() {
  const [products, heroSettings] = await Promise.all([
    fetchFeaturedProducts(),
    getHeroSettings(),
  ])

  console.log("[homepage] products loaded:", products.length)

  return <HomePage featuredProducts={products} heroImageUrl={heroSettings.url} heroImagePosition={heroSettings.position} />
}
