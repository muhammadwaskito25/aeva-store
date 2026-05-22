import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { ProductHref } from "@/lib/products"

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
  return (
    <article
      className={[
        "group relative overflow-hidden border border-black/10 bg-white transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-24px_rgba(20,17,12,0.35)]",
        className ?? "",
      ].join(" ")}
    >
      <Link href={href} aria-label={`View ${title}`} className="absolute inset-0 z-10" />
      <div className="relative aspect-[4/5] overflow-hidden bg-[#f2ece2]">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="space-y-1">
          {category ? (
            <p className="text-[10px] tracking-[0.16em] uppercase text-neutral-500">
              {category}
            </p>
          ) : null}
          <h3 className="text-sm font-medium tracking-[0.04em] text-neutral-900 sm:text-base">
            {title}
          </h3>
          <p className="text-sm text-neutral-600">{price}</p>
        </div>

        <Button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onAddToCart?.()
          }}
          className="relative z-20 h-10 w-full bg-neutral-900 text-[11px] tracking-[0.14em] text-white uppercase transition-colors hover:bg-neutral-800"
        >
          Add to Cart
          <ArrowUpRight className="size-3.5" />
        </Button>
      </div>
    </article>
  )
}
