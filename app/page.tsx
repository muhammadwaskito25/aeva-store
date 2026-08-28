import { HomePage } from "@/components/HomePage"
import { fetchFeaturedProducts } from "@/lib/products.repository"
import { getHeroImageUrl } from "@/lib/siteSettings"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function Page() {
  const [products, heroImageUrl] = await Promise.all([
    fetchFeaturedProducts(),
    getHeroImageUrl(),
  ])

  console.log("[homepage] products loaded:", products.length)

  return <HomePage featuredProducts={products} heroImageUrl={heroImageUrl} />
}
