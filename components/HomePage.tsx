"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import { motion } from "framer-motion"

import { FadeIn } from "@/components/FadeIn"
import { Navbar } from "@/components/Navbar"
import { SiteFooter } from "@/components/SiteFooter"
import { fadeUp, staggerContainer } from "@/lib/motion"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/ProductCard"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  type CartItem,
  type Product,
  formatCategory,
  formatPrice,
  getCartSubtotal,
  getProductHref,
  getProductImageAlt,
} from "@/lib/products"
import { Minus, Plus, Trash2 } from "lucide-react"

type HomePageProps = {
  featuredProducts: Product[]
}

export function HomePage({ featuredProducts }: HomePageProps) {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  const addToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [...prev, { ...product, quantity: 1 }]
    })
    setIsCartOpen(true)
  }

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId))
  }

  const changeQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev.flatMap((item) => {
        if (item.id !== productId) return item
        const nextQuantity = item.quantity + delta
        if (nextQuantity <= 0) return []
        return { ...item, quantity: nextQuantity }
      })
    )
  }

  const subtotal = useMemo(() => getCartSubtotal(cartItems), [cartItems])
  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems]
  )

  return (
    <main className="min-h-screen bg-[#f8f5ef] text-neutral-900">
      <Navbar cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} />

      <section
        id="home"
        className="mx-auto grid w-full max-w-6xl scroll-mt-24 gap-6 px-4 py-10 sm:px-6 sm:py-14 md:grid-cols-2 md:items-center md:py-20"
      >
        <FadeIn inView={false} className="space-y-6">
          <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-600" />
          <h1 className="font-heading text-4xl leading-tight sm:text-5xl md:text-6xl">
            Quiet Luxury
            <br />
            in Every Fold
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-neutral-700 sm:text-base">
            Elevated scarves crafted with refined textures and soft neutral
            tones. Designed for modern, minimal wardrobes.
          </p>
          <div className="pt-2">
            <Button
              asChild
              className="bg-neutral-900 px-7 text-[11px] tracking-[0.14em] text-white transition-all duration-500 ease-out hover:bg-neutral-800 hover:opacity-90"
            >
              <a href="#collection">Discover Collection</a>
            </Button>
          </div>
        </FadeIn>

        <FadeIn inView={false} delay={0.12} className="group relative overflow-hidden border border-black/10 bg-[#efe9df]">
          <div className="relative aspect-[4/5] w-full overflow-hidden">
            <Image
              src="/hero.png"
              alt="Spring Beige Edit — AEVA signature drop"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-all duration-700 ease-out group-hover:scale-[1.02] group-hover:opacity-95"
            />
          </div>
          <p className="absolute bottom-6 left-6 z-10 font-sans text-sm font-semibold tracking-[0.28em] text-white uppercase drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] transition-opacity duration-500 ease-out sm:text-base md:text-lg">
            Solids Series
          </p>
        </FadeIn>
      </section>

      <section id="collection" className="scroll-mt-24 border-y border-black/5 bg-[#fbf9f5]">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <FadeIn className="mb-8 flex items-end justify-between">
            <h2 className="font-heading text-2xl sm:text-3xl">Featured Pieces</h2>
            {featuredProducts.length > 0 && (
              <a
                href="#collection"
                className="text-[11px] uppercase tracking-[0.14em] text-neutral-600 transition-all duration-500 ease-out hover:text-neutral-900 hover:opacity-80"
              >
                View All
              </a>
            )}
          </FadeIn>

          {featuredProducts.length === 0 ? (
            <FadeIn>
              <div className="border border-black/10 bg-white/80 px-6 py-12 text-center">
                <p className="font-heading text-xl text-neutral-800">
                  Collection arriving soon
                </p>
                <p className="mt-2 text-sm text-neutral-600">
                  Our curated scarf edit is being prepared. Please check back shortly.
                </p>
              </div>
            </FadeIn>
          ) : (
            <motion.div
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
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
                    onAddToCart={() => addToCart(product)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <section id="tiktok" className="border-y border-black/5 bg-[#f3ede3]">
        <FadeIn className="mx-auto flex w-full max-w-6xl flex-col items-start gap-4 px-4 py-12 sm:px-6 sm:py-16 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
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

      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Cart</SheetTitle>
            <SheetDescription>
              Curated pieces in your AEVA selection.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 flex-1 space-y-4 overflow-y-auto pr-1">
            {cartItems.length === 0 ? (
              <div className="border border-black/10 bg-white/70 p-4 text-sm text-neutral-600">
                Your cart is empty.
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[80px_1fr] gap-3 border border-black/10 bg-white p-3"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#f1ece3]">
                    <Image
                      src={item.image}
                      alt={getProductImageAlt(item)}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm">{item.title}</p>
                        <p className="text-xs text-neutral-600">
                          {formatPrice(item.price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="inline-flex h-7 w-7 items-center justify-center border border-black/10 text-neutral-500 transition-colors hover:text-neutral-900"
                        aria-label={`Remove ${item.title} from cart`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    <div className="inline-flex items-center border border-black/10">
                      <button
                        type="button"
                        onClick={() => changeQuantity(item.id, -1)}
                        className="inline-flex h-8 w-8 items-center justify-center text-neutral-600 transition-colors hover:bg-black/5 hover:text-neutral-900"
                        aria-label={`Decrease quantity of ${item.title}`}
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="inline-flex min-w-8 justify-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeQuantity(item.id, 1)}
                        className="inline-flex h-8 w-8 items-center justify-center text-neutral-600 transition-colors hover:bg-black/5 hover:text-neutral-900"
                        aria-label={`Increase quantity of ${item.title}`}
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 space-y-4 border-t border-black/10 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">Subtotal</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            <Button
              asChild
              className="h-11 w-full bg-neutral-900 text-[11px] tracking-[0.14em] text-white uppercase hover:bg-neutral-800"
            >
              <Link href="/checkout">Checkout</Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </main>
  )
}
