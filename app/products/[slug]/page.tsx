import { notFound } from "next/navigation"

import { Navbar } from "@/components/Navbar"
import { ProductDetailActions } from "@/components/ProductDetailActions"
import { ProductGallery } from "@/components/ProductGallery"
import { formatCategory, formatPrice, getProductImageAlt } from "@/lib/products"
import { fetchProductBySlug } from "@/lib/products.repository"

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await fetchProductBySlug(slug)

  if (!product) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-[#f8f5ef] text-neutral-900">
      <Navbar />

      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-[11px] tracking-[0.16em] uppercase text-neutral-500">
          AEVA / {formatCategory(product.category)}
        </p>

        <div className="mt-5 grid gap-8 md:mt-8 md:grid-cols-2 md:gap-10">
          {/* Gallery */}
          <ProductGallery
            images={product.images}
            fallbackImage={product.image}
            alt={getProductImageAlt(product)}
          />

          {/* Details */}
          <div className="space-y-8">
            <div className="space-y-3">
              <h1 className="font-heading text-3xl leading-tight sm:text-4xl">
                {product.title}
              </h1>
              <p className="text-lg">{formatPrice(product.price)}</p>
              <p className="max-w-lg text-sm leading-relaxed text-neutral-700 sm:text-base">
                {product.description}
              </p>
            </div>

            <ProductDetailActions product={product} />
          </div>
        </div>
      </section>
    </main>
  )
}
