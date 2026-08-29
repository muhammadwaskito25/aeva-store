"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"

import { FadeIn } from "@/components/FadeIn"
import { Navbar } from "@/components/Navbar"
import { SiteFooter } from "@/components/SiteFooter"
import { fadeUp, staggerContainer } from "@/lib/motion"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/ProductCard"
import {
  type Product,
  formatCategory,
  formatPrice,
  getProductHref,
  getProductImageAlt,
} from "@/lib/products"
import { useCart } from "@/lib/cart"

type HomePageProps = {
  featuredProducts: Product[]
  heroImageUrl: string
  heroImagePosition: string
}

export function HomePage({ featuredProducts, heroImageUrl, heroImagePosition }: HomePageProps) {
  const { addToCart, openCart } = useCart()

  const handleAddToCart = (product: Product) => {
    addToCart(product)
    openCart()
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f8f5ef] text-neutral-900">
      <Navbar />

      <section
        id="home"
        className="relative w-full aspect-[16/9] max-h-[70vh] min-h-[500px] overflow-hidden bg-[#ebe6dc] flex items-center justify-center text-center"
      >
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={heroImageUrl}
            alt="Model posing with AEVA scarf draping gracefully"
            fill
            priority
            sizes="100vw"
            style={{ objectPosition: heroImagePosition }}
            className="object-cover transition-transform duration-[1200ms] ease-out hover:scale-[1.015]"
          />
          {/* Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Text Content Overlay */}
        <FadeIn className="relative z-10 space-y-6 sm:space-y-8 px-4 max-w-3xl mx-auto mt-16 md:mt-0">
          <div className="space-y-3 sm:space-y-4">
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-white drop-shadow-md">
              Solids Viscose Series
            </p>
            <h1 className="font-heading text-4xl leading-[1.1] tracking-tight sm:text-5xl lg:text-7xl text-white drop-shadow-lg">
              Quiet Luxury,
              <br />
              Gentle Drape
            </h1>
            <p className="max-w-lg mx-auto text-sm leading-relaxed text-white/90 sm:text-base drop-shadow-md">
              A curated line of refined, soft scarves and modestwear essentials
              crafted for understated elegance in daily rituals.
            </p>
          </div>

          <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-center">
            <Button
              asChild
              className="h-12 bg-white px-8 text-[11px] tracking-[0.16em] text-black uppercase hover:bg-white/90"
            >
              <Link href="#collection">Shop the Collection</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 border-white/50 bg-black/20 backdrop-blur-sm px-8 text-[11px] tracking-[0.16em] text-white uppercase hover:bg-black/40 hover:border-white"
            >
              <Link href="/about">Our Story</Link>
            </Button>
          </div>
        </FadeIn>
      </section>

      <section
        id="collection"
        className="scroll-mt-16 border-t border-black/10 bg-[#fcfbf8] py-14 sm:scroll-mt-20 sm:py-24"
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <FadeIn className="mb-10 flex flex-col gap-3.5 sm:mb-16 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div className="space-y-2.5 sm:space-y-3">
              <p className="text-[11px] font-medium tracking-[0.24em] uppercase text-neutral-500">
                Solids Viscose Collection
              </p>
              <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
                Featured Pieces
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-neutral-600">
              Timeless silhouettes designed in a soft neutral palette to layer and
              mix seamlessly.
            </p>
          </FadeIn>

          {featuredProducts.length === 0 ? (
            <FadeIn>
              <div className="border border-black/10 bg-white/70 py-12 text-center text-sm text-neutral-500">
                Belum ada produk yang ditampilkan.
              </div>
            </FadeIn>
          ) : (
            <motion.div
              className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
            >
              {featuredProducts.map((product, index) => (
                <motion.div key={product.id} variants={fadeUp} custom={index}>
                  <ProductCard
                    href={getProductHref(product.slug)}
                    imageSrc={product.image}
                    imageAlt={getProductImageAlt(product)}
                    title={product.title}
                    price={formatPrice(product.price)}
                    category={formatCategory(product.category)}
                    onAddToCart={() => handleAddToCart(product)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <section className="border-t border-black/10 bg-[#f8f5ef] py-14 sm:py-24">
        <FadeIn className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 px-4 text-center">
          <div className="space-y-2.5 sm:space-y-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-600">
              Follow on TikTok
            </p>
            <h3 className="font-heading text-2xl sm:text-3xl">
              Styling Rituals by AEVA
            </h3>
            <p className="text-sm text-neutral-700">
              See daily draping ideas and capsule outfit pairings.
            </p>
          </div>
          <Button className="bg-neutral-900 px-7 text-[11px] tracking-[0.14em] text-white transition-all duration-500 ease-out hover:bg-neutral-800 hover:opacity-90">
            @aevascarves
          </Button>
        </FadeIn>
      </section>

      <FadeIn>
        <SiteFooter />
      </FadeIn>
    </main>
  )
}
