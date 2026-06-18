"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"

import type { ProductHref } from "@/lib/products"
import { luxuryEase } from "@/lib/motion"
import { cn } from "@/lib/utils"

type ProductCardProps = {
  href: ProductHref
  imageSrc: string
  imageAlt: string
  title: string
  price: string
  category?: string
  /** @deprecated — Add to Cart button is no longer shown in the grid */
  onAddToCart?: () => void
  className?: string
}

export function ProductCard({
  href,
  imageSrc,
  imageAlt,
  title,
  price,
  className,
}: ProductCardProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.article
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -2,
              transition: { duration: 0.5, ease: luxuryEase },
            }
      }
      whileTap={reduceMotion ? undefined : { scale: 0.99 }}
      className={cn("group relative", className)}
    >
      {/* Entire card is a single link */}
      <Link
        href={href}
        aria-label={`View ${title}`}
        className="block"
      >
        {/* ── Product Image ───────────────────────────────────── */}
        <div className="relative aspect-[3/4] overflow-hidden bg-[#f2ece2] md:aspect-[4/5]">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 45vw, (max-width: 1024px) 50vw, 25vw"
            className={cn(
              "object-cover transition-all duration-700 ease-out",
              !reduceMotion && "md:group-hover:scale-[1.03] md:group-hover:opacity-95"
            )}
          />
        </div>

        {/* ── Product Info ─────────────────────────────────────── */}
        <div className="pt-3 pb-1 sm:pt-4">
          {/* Product name — uppercase, bold, tracking */}
          <h3 className="line-clamp-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-900 sm:text-xs md:text-[11px] md:tracking-[0.12em]">
            {title}
          </h3>
          {/* Price */}
          <p className="mt-1 text-[11px] text-neutral-500 sm:text-xs md:text-sm">
            {price}
          </p>
        </div>
      </Link>
    </motion.article>
  )
}
