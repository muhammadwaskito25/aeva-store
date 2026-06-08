"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useCart } from "@/lib/cart"
import { formatPrice, getProductImageAlt } from "@/lib/products"

export function CartSheet() {
  const {
    items,
    cartCount,
    subtotal,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    changeQuantity,
  } = useCart()

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Cart {cartCount > 0 ? `(${cartCount})` : ""}</SheetTitle>
          <SheetDescription>
            Curated pieces in your AEVA selection.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex-1 space-y-4 overflow-y-auto pr-1">
          {items.length === 0 ? (
            <div className="border border-black/10 bg-white/70 p-4 text-sm text-neutral-600">
              Your cart is empty.
            </div>
          ) : (
            items.map((item) => {
              const itemKey = `${item.id}-${item.selectedSize || ""}-${item.selectedColor || ""}`
              return (
                <div
                  key={itemKey}
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
                        {(item.selectedColor || item.selectedSize) && (
                          <p className="text-[11px] text-neutral-500">
                            {[item.selectedColor, item.selectedSize]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                        <p className="text-xs text-neutral-600">
                          {formatPrice(item.price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(
                            item.id,
                            item.selectedSize,
                            item.selectedColor
                          )
                        }
                        className="inline-flex h-7 w-7 items-center justify-center border border-black/10 text-neutral-500 transition-colors hover:text-neutral-900"
                        aria-label={`Remove ${item.title} from cart`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    <div className="inline-flex items-center border border-black/10">
                      <button
                        type="button"
                        onClick={() =>
                          changeQuantity(
                            item.id,
                            -1,
                            item.selectedSize,
                            item.selectedColor
                          )
                        }
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
                        onClick={() =>
                          changeQuantity(
                            item.id,
                            1,
                            item.selectedSize,
                            item.selectedColor
                          )
                        }
                        className="inline-flex h-8 w-8 items-center justify-center text-neutral-600 transition-colors hover:bg-black/5 hover:text-neutral-900"
                        aria-label={`Increase quantity of ${item.title}`}
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="mt-5 space-y-4 border-t border-black/10 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">Subtotal</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>
          <Button
            asChild
            onClick={() => setIsCartOpen(false)}
            className="h-11 w-full bg-neutral-900 text-[11px] tracking-[0.14em] text-white uppercase hover:bg-neutral-800"
          >
            <Link href="/checkout">Checkout</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
