"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart"
import type { Product } from "@/lib/products"

type ProductDetailActionsProps = {
  product: Product
}

export function ProductDetailActions({ product }: ProductDetailActionsProps) {
  const { addToCart, openCart } = useCart()
  const [size, setSize] = useState<string>(product.sizes[0] || "")
  const [color, setColor] = useState<string>(product.colors[0] || "")

  const handleAddToCart = () => {
    addToCart(product, size || undefined, color || undefined)
    openCart()
  }

  return (
    <div className="space-y-8">
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
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none transition focus:border-black/30"
              >
                {product.sizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
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
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none transition focus:border-black/30"
              >
                {product.colors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <Button
        onClick={handleAddToCart}
        className="h-11 w-full bg-neutral-900 text-[11px] tracking-[0.14em] text-white uppercase hover:bg-neutral-800 sm:w-auto sm:px-10"
      >
        Add to Cart
      </Button>
    </div>
  )
}
