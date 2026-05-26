"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"

import { Button } from "@/components/ui/button"
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
  onAddToCart?: () => void
  className?: string
}

export function ProductCard({
  href,
  imageSrc,
  imageAlt,
  title,
  price,
  category,
  onAddToCart,
  className,
}: ProductCardProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.article
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -3,
              transition: { duration: 0.55, ease: luxuryEase },
            }
      }
      whileTap={reduceMotion ? undefined : { scale: 0.99 }}
      className={cn(
        "group relative overflow-hidden border border-black/10 bg-white",
        "shadow-[0_0_0_0_rgba(0,0,0,0)] transition-[box-shadow,opacity] duration-700 ease-out",
        "md:hover:shadow-[0_18px_48px_-28px_rgba(20,17,12,0.28)] md:hover:opacity-[0.98]",
        "active:opacity-95",
        className
      )}
    >
      <Link href={href} aria-label={`View ${title}`} className="absolute inset-0 z-10" />
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

      <div className="space-y-2 p-2.5 transition-opacity duration-500 ease-out sm:space-y-3 sm:p-4 md:space-y-4 md:p-5 md:group-hover:opacity-90">
        <div className="space-y-0.5 sm:space-y-1">
          {category ? (
            <p className="text-[9px] tracking-[0.14em] uppercase text-neutral-500 sm:text-[10px] sm:tracking-[0.16em]">
              {category}
            </p>
          ) : null}
          <h3 className="line-clamp-2 text-xs font-medium leading-snug tracking-[0.02em] text-neutral-900 sm:text-sm md:text-base md:leading-normal md:tracking-[0.04em]">
            {title}
          </h3>
          <p className="text-[11px] text-neutral-600 sm:text-sm">{price}</p>
        </div>

        <Button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onAddToCart?.()
          }}
          className="relative z-20 h-8 w-full gap-1 bg-neutral-900 px-2 text-[9px] tracking-[0.12em] text-white uppercase transition-all duration-500 ease-out active:scale-[0.98] active:opacity-90 sm:h-9 sm:text-[10px] md:h-10 md:tracking-[0.14em]"
        >
          <span className="truncate">Add to Cart</span>
          <ArrowUpRight className="hidden size-3 shrink-0 transition-transform duration-500 ease-out md:inline md:group-hover:translate-x-0.5 md:group-hover:-translate-y-0.5" />
        </Button>
      </div>
    </motion.article>
  )
}
