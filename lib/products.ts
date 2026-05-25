export type ProductHref = `/products/${string}`

export type Product = {
  id: string
  slug: string
  title: string
  description: string
  price: number
  image: string
  category: string
  sizes: string[]
  colors: string[]
  featured: boolean
}

export type CartItem = Product & {
  quantity: number
}

export function getProductHref(slug: string): ProductHref {
  return `/products/${slug}`
}

/** Format angka sebagai Rupiah Indonesia (IDR). */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/** Tampilan label kategori di UI (huruf kapital per kata). */
export function formatCategory(category: string): string {
  return category
    .trim()
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

export function getProductImageAlt(product: Product): string {
  return `AEVA ${product.title} scarf`
}

export function getCartItemSubtotal(item: CartItem): number {
  return item.price * item.quantity
}

export function getCartSubtotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + getCartItemSubtotal(item), 0)
}
