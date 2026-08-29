import { HomePage } from "@/components/HomePage"
import { fetchFeaturedProducts } from "@/lib/products.repository"
import { getHeroSlides } from "@/lib/siteSettings"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function Page() {
  const [products, heroSlides] = await Promise.all([
    fetchFeaturedProducts(),
    getHeroSlides(),
  ])

  console.log("[homepage] products loaded:", products.length)

  return <HomePage featuredProducts={products} heroSlides={heroSlides} />
}
