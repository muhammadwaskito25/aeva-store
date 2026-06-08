"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

import type { CartItem, Product } from "@/lib/products"
import { getCartSubtotal } from "@/lib/products"

// ─── Types ────────────────────────────────────────────────────────────────────

type CartContextValue = {
  items: CartItem[]
  cartCount: number
  subtotal: number
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
  openCart: () => void
  closeCart: () => void
  addToCart: (product: Product, selectedSize?: string, selectedColor?: string) => void
  removeFromCart: (productId: string, selectedSize?: string, selectedColor?: string) => void
  changeQuantity: (productId: string, delta: number, selectedSize?: string, selectedColor?: string) => void
  clearCart: () => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = "aeva_cart"

function readStorage(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed as CartItem[]
  } catch {
    return []
  }
}

function writeStorage(items: CartItem[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Storage might be full or disabled — silent fail
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Initialize from LocalStorage on first mount (client only)
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  const openCart = useCallback(() => setIsCartOpen(true), [])
  const closeCart = useCallback(() => setIsCartOpen(false), [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(readStorage())
    setHydrated(true)
  }, [])

  // Persist every change to LocalStorage
  useEffect(() => {
    if (!hydrated) return
    writeStorage(items)
  }, [items, hydrated])

  const addToCart = useCallback((product: Product, selectedSize?: string, selectedColor?: string) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.id === product.id &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor
      )
      if (existingIndex > -1) {
        return prev.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { ...product, quantity: 1, selectedSize, selectedColor }]
    })
  }, [])

  const removeFromCart = useCallback((productId: string, selectedSize?: string, selectedColor?: string) => {
    setItems((prev) =>
      prev.filter(
        (item) =>
          !(
            item.id === productId &&
            item.selectedSize === selectedSize &&
            item.selectedColor === selectedColor
          )
      )
    )
  }, [])

  const changeQuantity = useCallback((productId: string, delta: number, selectedSize?: string, selectedColor?: string) => {
    setItems((prev) =>
      prev.flatMap((item) => {
        if (
          item.id !== productId ||
          item.selectedSize !== selectedSize ||
          item.selectedColor !== selectedColor
        ) {
          return item
        }
        const next = item.quantity + delta
        if (next <= 0) return []
        return { ...item, quantity: next }
      })
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const cartCount = items.reduce((total, item) => total + item.quantity, 0)
  const subtotal = getCartSubtotal(items)

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount,
        subtotal,
        isCartOpen,
        setIsCartOpen,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        changeQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error("useCart must be used inside <CartProvider>")
  }
  return ctx
}
