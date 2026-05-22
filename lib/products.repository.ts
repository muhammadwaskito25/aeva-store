import { createSupabaseClient, isSupabaseConfigured } from "@/lib/supabase"
import type { Product, ProductCategory } from "@/lib/products"

const PRODUCT_CATEGORIES: ProductCategory[] = [
  "silk",
  "cashmere-blend",
  "wool",
]

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string")
  }
  return []
}

function normalizeCategory(value: unknown): ProductCategory {
  const category = String(value ?? "silk")
  if (PRODUCT_CATEGORIES.includes(category as ProductCategory)) {
    return category as ProductCategory
  }
  return "silk"
}

export function mapProductRow(row: Record<string, unknown>): Product | null {
  const id = row.id != null ? String(row.id) : ""
  const slug = row.slug != null ? String(row.slug) : ""
  const title = row.title != null ? String(row.title) : ""

  if (!id || !slug || !title) {
    console.warn("[products] Skipping row missing id, slug, or title:", row)
    return null
  }

  return {
    id,
    slug,
    title,
    description: String(row.description ?? ""),
    price: Number(row.price ?? 0),
    image: String(row.image ?? row.image_url ?? row.image_src ?? ""),
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
    .select("*")
    .order("title", { ascending: true })

  console.log("[products] Supabase fetch — error:", error?.message ?? null)
  console.log("[products] Supabase fetch — raw data:", JSON.stringify(data, null, 2))

  if (error) {
    console.error("[products] fetchProducts failed:", error.message, error)
    return []
  }

  const mapped =
    (data as Record<string, unknown>[] | null)
      ?.map(mapProductRow)
      .filter((product): product is Product => product !== null) ?? []

  console.log("[products] Mapped products:", mapped.length, mapped)

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
    .select("*")
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
