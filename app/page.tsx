import { HomePage } from "@/components/HomePage"
import { fetchProducts } from "@/lib/products.repository"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function Page() {
  const products = await fetchProducts()

  console.log("[homepage] products loaded:", products.length)

  return <HomePage featuredProducts={products} />
}
