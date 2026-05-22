export type ProductCategory = "silk" | "cashmere-blend" | "wool"

export type ProductHref = `/products/${string}`

export type Product = {
  id: string
  slug: string
  title: string
  description: string
  price: number
  image: string
  category: ProductCategory
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

export function formatPrice(price: number): string {
  return `$${price}`
}

export function formatCategory(category: ProductCategory): string {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
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
