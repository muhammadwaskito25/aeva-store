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
      className={cn(
        "group relative overflow-hidden border border-black/10 bg-white",
        "shadow-[0_0_0_0_rgba(0,0,0,0)] transition-[box-shadow,opacity] duration-700 ease-out",
        "hover:shadow-[0_18px_48px_-28px_rgba(20,17,12,0.28)] hover:opacity-[0.98]",
        className
      )}
    >
      <Link href={href} aria-label={`View ${title}`} className="absolute inset-0 z-10" />
      <div className="relative aspect-[4/5] overflow-hidden bg-[#f2ece2]">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={cn(
            "object-cover transition-all duration-700 ease-out",
            !reduceMotion && "group-hover:scale-[1.03] group-hover:opacity-95"
          )}
        />
      </div>

      <div className="space-y-4 p-4 transition-opacity duration-500 ease-out group-hover:opacity-90 sm:p-5">
        <div className="space-y-1">
          {category ? (
            <p className="text-[10px] tracking-[0.16em] uppercase text-neutral-500 transition-colors duration-500 ease-out group-hover:text-neutral-600">
              {category}
            </p>
          ) : null}
          <h3 className="text-sm font-medium tracking-[0.04em] text-neutral-900 transition-colors duration-500 ease-out group-hover:text-neutral-800 sm:text-base">
            {title}
          </h3>
          <p className="text-sm text-neutral-600 transition-colors duration-500 ease-out">
            {price}
          </p>
        </div>

        <Button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onAddToCart?.()
          }}
          className="relative z-20 h-10 w-full bg-neutral-900 text-[11px] tracking-[0.14em] text-white uppercase transition-all duration-500 ease-out hover:bg-neutral-800 hover:opacity-90"
        >
          Add to Cart
          <ArrowUpRight className="size-3.5 transition-transform duration-500 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Button>
      </div>
    </motion.article>
  )
}
