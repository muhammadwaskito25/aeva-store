"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"

import type { CartItem, Product } from "@/lib/products"
import { getCartSubtotal } from "@/lib/products"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

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

/** Guest storage key — used when no user is logged in */
const GUEST_KEY = "aeva_cart_guest"

function storageKey(userId: string | null): string {
  return userId ? `aeva_cart_${userId}` : GUEST_KEY
}

function readStorage(key: string): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as CartItem[]) : []
  } catch {
    return []
  }
}

function writeStorage(key: string, items: CartItem[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(items))
  } catch {
    // Storage full or disabled — silent fail
  }
}

function clearStorage(key: string): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(key)
  } catch {
    /* noop */
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  /**
   * Current storage key — changes when the logged-in user changes.
   * null means "not yet resolved" (before Supabase responds).
   */
  const [userId, setUserId] = useState<string | null | undefined>(undefined)
  const currentKey = useRef<string>(GUEST_KEY)

  const openCart = useCallback(() => setIsCartOpen(true), [])
  const closeCart = useCallback(() => setIsCartOpen(false), [])

  // ── Auth listener ─────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    // Resolve initial auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null)
    })

    // Keep in sync with auth changes (login / logout / account switch)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user?.id ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ── Reload cart whenever the active user changes ───────────────────────────
  useEffect(() => {
    // Wait until auth is resolved
    if (userId === undefined) return

    const prevKey = currentKey.current
    const nextKey = storageKey(userId)

    if (prevKey === nextKey && hydrated) return // same user, already loaded

    // If switching FROM a logged-in user TO guest/another user, save current
    // items to the previous key so they're not lost, then load the new key.
    if (hydrated && prevKey !== nextKey) {
      // Items are already written to prevKey by the write effect below
      // (nothing extra needed here)
    }

    currentKey.current = nextKey

    // When logging out → guest cart starts empty (don't carry over user items)
    // When switching users → load the new user's own cart
    const loaded = readStorage(nextKey)
    setItems(loaded)
    setHydrated(true)
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist every change to the current user's storage key ───────────────
  useEffect(() => {
    if (!hydrated) return
    writeStorage(currentKey.current, items)
  }, [items, hydrated])

  // ─── Cart actions ──────────────────────────────────────────────────────────

  const addToCart = useCallback(
    (product: Product, selectedSize?: string, selectedColor?: string) => {
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
    },
    []
  )

  const removeFromCart = useCallback(
    (productId: string, selectedSize?: string, selectedColor?: string) => {
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
    },
    []
  )

  const changeQuantity = useCallback(
    (
      productId: string,
      delta: number,
      selectedSize?: string,
      selectedColor?: string
    ) => {
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
    },
    []
  )

  const clearCart = useCallback(() => {
    setItems([])
    clearStorage(currentKey.current)
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
