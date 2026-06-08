import { createSupabaseClient, isSupabaseConfigured } from "@/lib/supabase"
import type { Product, ProductImage } from "@/lib/products"

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string")
  }
  return []
}

function normalizeCategory(value: unknown): string {
  const category = String(value ?? "").trim()
  return category || "general"
}

function mapImageRow(row: Record<string, unknown>): ProductImage | null {
  const id = row.id != null ? String(row.id) : ""
  const url = row.url != null ? String(row.url) : ""
  if (!id || !url) return null
  return {
    id,
    product_id: String(row.product_id ?? ""),
    storage_path: String(row.storage_path ?? ""),
    url,
    display_order: Number(row.display_order ?? 0),
  }
}

export function mapProductRow(row: Record<string, unknown>): Product | null {
  const id = row.id != null ? String(row.id) : ""
  const slug = row.slug != null ? String(row.slug) : ""
  const title = row.title != null ? String(row.title) : ""

  if (!id || !slug || !title) {
    console.warn("[products] Skipping row missing id, slug, or title:", row)
    return null
  }

  // Map joined product_images rows (sorted by display_order)
  const rawImages = Array.isArray(row.product_images)
    ? (row.product_images as Record<string, unknown>[])
    : []

  const images: ProductImage[] = rawImages
    .map(mapImageRow)
    .filter((img): img is ProductImage => img !== null)
    .sort((a, b) => a.display_order - b.display_order)

  // Cover image: first uploaded image, or legacy image column
  const legacyImage = String(row.image ?? row.image_url ?? row.image_src ?? "")
  const coverImage = images[0]?.url ?? legacyImage

  return {
    id,
    slug,
    title,
    description: String(row.description ?? ""),
    price: Number(row.price ?? 0),
    image: coverImage,
    images,
    category: normalizeCategory(row.category),
    sizes: normalizeStringArray(row.sizes),
    colors: normalizeStringArray(row.colors),
    featured: Boolean(row.featured ?? false),
  }
}

export async function fetchProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    console.warn(
      "[products] Supabase env missing — add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
    )
    return []
  }

  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(id, product_id, storage_path, url, display_order)")
    .order("title", { ascending: true })

  if (error) {
    console.error("[products] fetchProducts failed:", error.message, error)
    return []
  }

  const mapped =
    (data as Record<string, unknown>[] | null)
      ?.map(mapProductRow)
      .filter((product): product is Product => product !== null) ?? []

  return mapped
}

/** Returns all products (no featured filter). */
export async function fetchFeaturedProducts(): Promise<Product[]> {
  return fetchProducts()
}

export async function fetchProductBySlug(
  slug: string
): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(id, product_id, storage_path, url, display_order)")
    .eq("slug", slug)
    .maybeSingle()

  if (error) {
    console.error("[products] fetchProductBySlug:", error.message, error)
    return null
  }

  if (!data) {
    return null
  }

  return mapProductRow(data as Record<string, unknown>)
}
