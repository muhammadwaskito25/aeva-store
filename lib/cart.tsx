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

const GUEST_KEY = "aeva_cart_guest"

function lsKey(userId: string | null) {
  return userId ? `aeva_cart_${userId}` : GUEST_KEY
}

function lsRead(key: string): CartItem[] {
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

function lsWrite(key: string, items: CartItem[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(items))
  } catch { /* noop */ }
}

// ─── Supabase sync helpers ────────────────────────────────────────────────────

/** Load cart from Supabase and build CartItem[] by joining products table. */
async function dbLoad(userId: string): Promise<CartItem[]> {
  const supabase = createSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("cart_items")
    .select(`
      quantity, selected_size, selected_color,
      product:products (
        id, slug, title, description, price, image,
        category, sizes, colors, featured
      )
    `)
    .eq("user_id", userId)

  if (error || !data) return []

  return data.flatMap((row) => {
    type PRow = {
      id: number; slug: string; title: string; price: number;
      image: string; description: string; category: string;
      sizes: string[]; colors: string[]; featured: boolean;
    }
    // Supabase returns joined rows as array even for many-to-one
    const pArr = row.product as PRow[] | PRow | null
    const p: PRow | null = Array.isArray(pArr) ? (pArr[0] ?? null) : pArr
    if (!p) return []
    const item: CartItem = {
      id: String(p.id),
      slug: p.slug,
      title: p.title,
      description: p.description ?? "",
      price: p.price,
      image: p.image ?? "",
      images: [],
      category: p.category ?? "",
      sizes: p.sizes ?? [],
      colors: p.colors ?? [],
      featured: p.featured ?? false,
      quantity: row.quantity as number,
      selectedSize: (row.selected_size as string | null) ?? undefined,
      selectedColor: (row.selected_color as string | null) ?? undefined,
    }
    return [item]
  })
}

/**
 * Replace the user's entire DB cart with the current items array.
 * Using delete-then-insert keeps logic simple for a small cart.
 */
async function dbSync(userId: string, items: CartItem[]) {
  const supabase = createSupabaseBrowserClient()
  await supabase.from("cart_items").delete().eq("user_id", userId)
  if (items.length === 0) return
  await supabase.from("cart_items").insert(
    items.map((item) => ({
      user_id: userId,
      product_id: Number(item.id),
      quantity: item.quantity,
      selected_size: item.selectedSize ?? null,
      selected_color: item.selectedColor ?? null,
      updated_at: new Date().toISOString(),
    }))
  )
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  /** undefined = auth not yet resolved; null = guest; string = logged-in userId */
  const [userId, setUserId] = useState<string | null | undefined>(undefined)

  const currentUserId = useRef<string | null>(null)
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openCart = useCallback(() => setIsCartOpen(true), [])
  const closeCart = useCallback(() => setIsCartOpen(false), [])

  // ── Subscribe to auth state ───────────────────────────────────────────────
  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data: { user } }) =>
      setUserId(user?.id ?? null)
    )
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUserId(session?.user?.id ?? null)
    )
    return () => subscription.unsubscribe()
  }, [])

  // ── Load cart whenever auth resolves or user switches ─────────────────────
  useEffect(() => {
    if (userId === undefined) return // still loading

    const prevUserId = currentUserId.current
    currentUserId.current = userId ?? null

    async function load() {
      if (userId) {
        // Logged-in: fetch from Supabase (source of truth for cross-device)
        const dbItems = await dbLoad(userId)
        if (dbItems.length > 0) {
          setItems(dbItems)
          lsWrite(lsKey(userId), dbItems)
          return
        }
        // No DB cart yet — try migrating from localStorage if items exist
        const cached = lsRead(lsKey(userId))
        if (cached.length > 0) {
          setItems(cached)
          await dbSync(userId, cached)
        } else {
          setItems([])
        }
      } else {
        // Logged out: clear if we were previously logged in, load guest cart
        if (prevUserId) setItems([])
        else setItems(lsRead(GUEST_KEY))
      }
    }

    void load()
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist to localStorage + debounce sync to Supabase ──────────────────
  useEffect(() => {
    if (userId === undefined) return
    const key = lsKey(userId ?? null)
    lsWrite(key, items)

    if (!userId) return // guest: no DB sync needed

    // Debounce Supabase sync by 600ms to batch rapid mutations
    if (syncTimer.current) clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(() => {
      void dbSync(userId, items)
    }, 600)

    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current)
    }
  }, [items, userId])

  // ─── Cart mutations ────────────────────────────────────────────────────────

  const addToCart = useCallback(
    (product: Product, selectedSize?: string, selectedColor?: string) => {
      setItems((prev) => {
        const idx = prev.findIndex(
          (i) =>
            i.id === product.id &&
            i.selectedSize === selectedSize &&
            i.selectedColor === selectedColor
        )
        if (idx > -1) {
          return prev.map((i, n) =>
            n === idx ? { ...i, quantity: i.quantity + 1 } : i
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
          (i) =>
            !(
              i.id === productId &&
              i.selectedSize === selectedSize &&
              i.selectedColor === selectedColor
            )
        )
      )
    },
    []
  )

  const changeQuantity = useCallback(
    (productId: string, delta: number, selectedSize?: string, selectedColor?: string) => {
      setItems((prev) =>
        prev.flatMap((i) => {
          if (
            i.id !== productId ||
            i.selectedSize !== selectedSize ||
            i.selectedColor !== selectedColor
          )
            return i
          const next = i.quantity + delta
          return next <= 0 ? [] : [{ ...i, quantity: next }]
        })
      )
    },
    []
  )

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const cartCount = items.reduce((t, i) => t + i.quantity, 0)
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
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>")
  return ctx
}
