import Image from "next/image"
import { notFound } from "next/navigation"

import { BrandLogo } from "@/components/BrandLogo"
import { Button } from "@/components/ui/button"
import { formatPrice, getProductImageAlt } from "@/lib/products"
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
      <header className="sticky top-0 z-50 border-b border-black/10 bg-[#f8f5ef]/75 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
          <BrandLogo />
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-[11px] tracking-[0.16em] uppercase text-neutral-500">
          AEVA / {product.category}
        </p>

        <div className="mt-5 grid gap-8 md:mt-8 md:grid-cols-2 md:gap-10">
          <div className="overflow-hidden border border-black/10 bg-[#f1ece3]">
            <div className="relative aspect-[4/5] w-full">
              <Image
                src={product.image}
                alt={getProductImageAlt(product)}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>

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

            {(product.sizes.length > 0 || product.colors.length > 0) && (
              <div className="space-y-6">
                {product.sizes.length > 0 && (
                  <div className="space-y-2">
                    <label
                      htmlFor="size"
                      className="text-[11px] tracking-[0.14em] uppercase text-neutral-500"
                    >
                      Size
                    </label>
                    <select
                      id="size"
                      defaultValue={product.sizes[0]}
                      className="h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none transition focus:border-black/30"
                    >
                      {product.sizes.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {product.colors.length > 0 && (
                  <div className="space-y-2">
                    <label
                      htmlFor="color"
                      className="text-[11px] tracking-[0.14em] uppercase text-neutral-500"
                    >
                      Color
                    </label>
                    <select
                      id="color"
                      defaultValue={product.colors[0]}
                      className="h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none transition focus:border-black/30"
                    >
                      {product.colors.map((color) => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <Button className="h-11 w-full bg-neutral-900 text-[11px] tracking-[0.14em] text-white uppercase hover:bg-neutral-800 sm:w-auto sm:px-10">
              Add to Cart
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
