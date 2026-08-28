"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  LogOut,
  Pencil,
  Star,
  Trash2,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/products"
import type { ProductImage } from "@/lib/products"
import {
  deleteProductImage,
  fetchProductImages,
  reorderProductImages,
  uploadProductImage,
  validateImageFile,
} from "@/lib/productImages"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { isSupabaseConfigured } from "@/lib/supabase"

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminProduct = {
  id: string
  title: string
  slug: string
  price: number
  description: string
  image: string
  category: string
  sizes: string[]
  colors: string[]
  featured: boolean
}

type ProductFormState = {
  title: string
  slug: string
  price: string
  category: string
  description: string
  sizes: string
  colors: string
  featured: boolean
}

const emptyForm: ProductFormState = {
  title: "",
  slug: "",
  price: "",
  category: "",
  description: "",
  sizes: "",
  colors: "",
  featured: false,
}

const inputClassName =
  "h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function formatError(err: unknown, fallback: string): string {
  console.error("[admin]", err)
  if (err && typeof err === "object") {
    const e = err as { message?: string; code?: string; details?: string; hint?: string }
    const parts = [e.message, e.details, e.hint, e.code ? `(${e.code})` : ""].filter(Boolean)
    if (parts.length > 0) return parts.join(" — ")
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string")
  }
  return []
}

function mapRow(row: Record<string, unknown>): AdminProduct | null {
  const id = row.id != null ? String(row.id) : ""
  const title = row.title != null ? String(row.title) : ""
  const slug = row.slug != null ? String(row.slug) : ""
  if (!id || !title || !slug) return null
  return {
    id,
    title,
    slug,
    price: Number(row.price ?? 0),
    description: String(row.description ?? ""),
    image: String(row.image ?? ""),
    category: String(row.category ?? ""),
    sizes: normalizeStringArray(row.sizes),
    colors: normalizeStringArray(row.colors),
    featured: Boolean(row.featured ?? false),
  }
}

function productToForm(product: AdminProduct): ProductFormState {
  return {
    title: product.title,
    slug: product.slug,
    price: String(product.price),
    category: product.category,
    description: product.description,
    sizes: product.sizes.join(", "),
    colors: product.colors.join(", "),
    featured: product.featured,
  }
}

// ─── Image Manager sub-component ──────────────────────────────────────────────

type ImageManagerProps = {
  productId: string
  images: ProductImage[]
  loading: boolean
  uploading: boolean
  onUpload: (files: FileList) => void
  onDelete: (image: ProductImage) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
}

function ImageManager({
  images,
  loading,
  uploading,
  onUpload,
  onDelete,
  onMoveUp,
  onMoveDown,
  fileInputRef,
}: Omit<ImageManagerProps, "productId">) {
  const canUpload = images.length < 5

  return (
    <div className="mt-6 space-y-4 border-t border-neutral-100 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-neutral-900">
            Product Images
          </h3>
          <p className="mt-0.5 text-xs text-neutral-500">
            {images.length}/5 &middot; First image is cover
          </p>
        </div>
        {canUpload && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[11px] tracking-[0.1em] uppercase text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-50"
          >
            <ImagePlus className="size-3.5" />
            {uploading ? "Uploading…" : "Add Photos"}
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files && onUpload(e.target.files)}
      />

      {loading ? (
        <div className="flex items-center justify-center py-8 text-xs text-neutral-400">
          Loading images…
        </div>
      ) : images.length === 0 ? (
        /* Empty state — clickable upload zone */
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 py-10 text-center transition hover:border-neutral-400 hover:bg-neutral-100 disabled:opacity-50"
        >
          <ImagePlus className="size-7 text-neutral-400" />
          <p className="text-sm font-medium text-neutral-700">
            {uploading ? "Uploading…" : "Upload product photos"}
          </p>
          <p className="text-xs text-neutral-400">
            JPEG, PNG, or WebP · max 5 MB each · up to 5 images
          </p>
        </button>
      ) : (
        <div className="space-y-2">
          {images.map((img, index) => (
            <div
              key={img.id}
              className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-2.5"
            >
              {/* Thumbnail */}
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                <Image
                  src={img.url}
                  alt={`Image ${index + 1}`}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>

              {/* Label */}
              <div className="flex flex-1 items-center gap-2 min-w-0">
                {index === 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-neutral-900 px-2 py-0.5 text-[10px] tracking-[0.08em] text-white uppercase">
                    <Star className="size-2.5" />
                    Cover
                  </span>
                )}
                <span className="truncate text-xs text-neutral-400">
                  Image {index + 1}
                </span>
              </div>

              {/* Controls */}
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={index === 0}
                  onClick={() => onMoveUp(index)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={index === images.length - 1}
                  onClick={() => onMoveDown(index)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowDown className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Delete image"
                  onClick={() => onDelete(img)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Upload more (if slot available) */}
          {canUpload && (
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-200 bg-white py-3 text-xs text-neutral-500 transition hover:border-neutral-400 hover:text-neutral-700 disabled:opacity-50"
            >
              <ImagePlus className="size-3.5" />
              {uploading ? "Uploading…" : `Add more (${5 - images.length} remaining)`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Admin Page ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter()

  // Products list state
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState<ProductFormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [slugTouched, setSlugTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Image manager state
  const [productImages, setProductImages] = useState<ProductImage[]>([])
  const [imagesLoading, setImagesLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // UI state
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const supabaseReady = useMemo(() => isSupabaseConfigured(), [])
  const isEditing = editingId !== null

  // ── Fetch products ───────────────────────────────────

  const loadProducts = useCallback(async () => {
    if (!supabaseReady) {
      setError("Supabase belum dikonfigurasi.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .order("title", { ascending: true })

      if (fetchError) throw fetchError

      const mapped =
        (data as Record<string, unknown>[] | null)
          ?.map(mapRow)
          .filter((item): item is AdminProduct => item !== null) ?? []

      setProducts(mapped)
    } catch (err) {
      setError(formatError(err, "Gagal memuat produk."))
    } finally {
      setLoading(false)
    }
  }, [supabaseReady])

  // ── Fetch images for editing product ────────────────

  const loadImages = useCallback(async (productId: string) => {
    setImagesLoading(true)
    setProductImages([])
    try {
      const imgs = await fetchProductImages(productId)
      setProductImages(imgs)
    } catch (err) {
      console.error("[admin] loadImages:", err)
    } finally {
      setImagesLoading(false)
    }
  }, [])

  // ── Form parsing ─────────────────────────────────────

  function parseForm() {
    const title = form.title.trim()
    const slug = slugify(form.slug.trim() || title)
    const price = Number(form.price)
    const category = form.category.trim()
    const description = form.description.trim()
    const sizes = form.sizes.split(",").map((s) => s.trim()).filter(Boolean)
    const colors = form.colors.split(",").map((c) => c.trim()).filter(Boolean)
    const featured = form.featured

    if (!title || !slug || !category || Number.isNaN(price) || price < 0) {
      throw new Error("Lengkapi title, slug, price, dan category.")
    }

    return { title, slug, price, category, description, sizes, colors, featured }
  }

  // ── Add product ───────────────────────────────────────

  async function addProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      const payload = parseForm()
      const supabase = createSupabaseBrowserClient()

      const { data: inserted, error: insertError } = await supabase
        .from("products")
        .insert({ ...payload, image: "" })
        .select("*")
        .single()

      if (insertError) throw insertError

      await loadProducts()

      const newProduct = mapRow(inserted as Record<string, unknown>)
      if (newProduct) {
        setEditingId(newProduct.id)
        setSlugTouched(true)
        setForm(productToForm(newProduct))
        setProductImages([])
        setMessage("Produk ditambahkan! Tambahkan foto di bawah.")
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        setForm(emptyForm)
        setSlugTouched(false)
        setMessage("Produk berhasil ditambahkan.")
      }
    } catch (err) {
      setError(formatError(err, "Gagal menambah produk."))
    } finally {
      setSubmitting(false)
    }
  }

  // ── Update product ────────────────────────────────────

  async function updateProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingId) return

    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      const payload = parseForm()
      const supabase = createSupabaseBrowserClient()

      const { error: updateError } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingId)

      if (updateError) throw updateError

      setMessage("Produk berhasil diperbarui.")
      await loadProducts()
    } catch (err) {
      setError(formatError(err, "Gagal memperbarui produk."))
    } finally {
      setSubmitting(false)
    }
  }

  // ── Delete product ────────────────────────────────────

  async function deleteProduct(id: string) {
    const confirmed = window.confirm("Hapus produk ini?")
    if (!confirmed) return

    setDeletingId(id)
    setError(null)
    setMessage(null)

    try {
      const supabase = createSupabaseBrowserClient()
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", id)

      if (deleteError) throw deleteError

      if (editingId === id) cancelEdit()

      setMessage("Produk dihapus.")
      await loadProducts()
    } catch (err) {
      setError(formatError(err, "Gagal menghapus produk."))
    } finally {
      setDeletingId(null)
    }
  }

  // ── Edit helpers ──────────────────────────────────────

  function startEdit(product: AdminProduct) {
    setEditingId(product.id)
    setSlugTouched(true)
    setForm(productToForm(product))
    setError(null)
    setMessage(null)
    void loadImages(product.id)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setSlugTouched(false)
    setProductImages([])
    setError(null)
    setMessage(null)
  }

  // ── Image upload ──────────────────────────────────────

  async function handleUpload(files: FileList) {
    if (!editingId) return

    const fileArray = Array.from(files)
    const available = 5 - productImages.length
    const toUpload = fileArray.slice(0, available)

    // Validate all first
    const errors: string[] = []
    for (const f of toUpload) {
      const err = validateImageFile(f)
      if (err) errors.push(err)
    }
    if (errors.length > 0) {
      setError(errors.join("\n"))
      return
    }

    setUploading(true)
    setError(null)

    try {
      for (let i = 0; i < toUpload.length; i++) {
        const order = productImages.length + i
        await uploadProductImage(editingId, toUpload[i], order)
      }
      await loadImages(editingId)
      await loadProducts() // refresh cover in card list
      setMessage(`${toUpload.length} foto berhasil diupload.`)
    } catch (err) {
      setError(formatError(err, "Gagal mengupload foto."))
    } finally {
      setUploading(false)
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // ── Image delete ──────────────────────────────────────

  async function handleDeleteImage(img: ProductImage) {
    if (!editingId) return
    const confirmed = window.confirm("Hapus foto ini?")
    if (!confirmed) return

    setError(null)
    try {
      const remaining = await deleteProductImage(img.id, img.storage_path, editingId)
      setProductImages(remaining)
      await loadProducts()
      setMessage("Foto dihapus.")
    } catch (err) {
      setError(formatError(err, "Gagal menghapus foto."))
    }
  }

  // ── Image reorder ─────────────────────────────────────

  async function handleMoveUp(index: number) {
    if (!editingId || index === 0) return
    try {
      const reordered = await reorderProductImages(editingId, productImages, index, index - 1)
      setProductImages(reordered)
      await loadProducts()
    } catch (err) {
      setError(formatError(err, "Gagal mengubah urutan foto."))
    }
  }

  async function handleMoveDown(index: number) {
    if (!editingId || index === productImages.length - 1) return
    try {
      const reordered = await reorderProductImages(editingId, productImages, index, index + 1)
      setProductImages(reordered)
      await loadProducts()
    } catch (err) {
      setError(formatError(err, "Gagal mengubah urutan foto."))
    }
  }

  // ── Logout ────────────────────────────────────────────

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
    router.refresh()
  }

  // ── Init ──────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      if (!supabaseReady) {
        setAuthLoading(false)
        setLoading(false)
        setError("Supabase belum dikonfigurasi.")
        return
      }

      try {
        const supabase = createSupabaseBrowserClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.replace("/admin/login")
          return
        }

        // ── Admin identity check (second layer after middleware) ───────────
        // This protects against edge cases where middleware cache is stale.
        const response = await fetch("/api/admin/verify")
        if (!response.ok) {
          // Not admin — redirect to home
          router.replace("/")
          return
        }

        setUserEmail(user.email ?? null)
        await loadProducts()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat sesi admin.")
      } finally {
        setAuthLoading(false)
      }
    }

    void init()
  }, [loadProducts, router, supabaseReady])

  // ── Loading gate ──────────────────────────────────────

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 text-sm text-neutral-500">
        Memuat dashboard…
      </main>
    )
  }

  // ── Render ────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-neutral-500">
              AEVA Admin
            </p>
            <h1 className="mt-2 font-heading text-3xl tracking-tight sm:text-4xl">
              Product Dashboard
            </h1>
            <p className="mt-2 max-w-xl text-sm text-neutral-600">
              Kelola katalog produk — tambah, edit, hapus, dan atur foto.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {userEmail ? (
              <p className="text-sm text-neutral-500">{userEmail}</p>
            ) : null}
            <p className="text-sm text-neutral-500">{products.length} produk</p>
            <a
              href="/admin"
              className="inline-flex h-10 items-center rounded-xl border border-neutral-900 bg-neutral-900 px-4 text-[11px] tracking-[0.14em] uppercase text-white transition"
            >
              Produk
            </a>
            <a
              href="/admin/settings"
              className="inline-flex h-10 items-center rounded-xl border border-neutral-200 px-4 text-[11px] tracking-[0.14em] uppercase text-neutral-700 transition hover:border-neutral-400"
            >
              Pengaturan
            </a>
            <a
              href="/admin/orders"
              className="inline-flex h-10 items-center rounded-xl border border-neutral-200 px-4 text-[11px] tracking-[0.14em] uppercase text-neutral-700 transition hover:border-neutral-400"
            >
              Pesanan
            </a>
            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              className="h-10 rounded-xl border-neutral-300 text-[11px] tracking-[0.14em] uppercase"
            >
              <LogOut className="size-3.5" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[400px_1fr] lg:gap-10">
        {/* ── Form panel ────────────────────────────────── */}
        <section className="h-fit rounded-xl border border-neutral-200 bg-white p-6 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.18)] lg:sticky lg:top-8">
          <h2 className="text-lg font-semibold tracking-tight">
            {isEditing ? "Edit Product" : "Add Product"}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {isEditing
              ? "Perbarui detail lalu simpan. Kelola foto di bawah."
              : "Simpan dulu, lalu tambah foto produk."}
          </p>

          <form
            onSubmit={isEditing ? updateProduct : addProduct}
            className="mt-6 space-y-4"
          >
            {/* Title */}
            <label className="block space-y-2">
              <span className="text-xs font-medium tracking-[0.14em] uppercase text-neutral-500">
                Title
              </span>
              <input
                className={inputClassName}
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value
                  setForm((prev) => ({
                    ...prev,
                    title,
                    slug:
                      isEditing || slugTouched
                        ? prev.slug
                        : slugify(title) || prev.slug,
                  }))
                }}
                placeholder="Han River Silk"
                required
              />
            </label>

            {/* Slug */}
            <label className="block space-y-2">
              <span className="text-xs font-medium tracking-[0.14em] uppercase text-neutral-500">
                Slug
              </span>
              <input
                className={inputClassName}
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setForm((prev) => ({ ...prev, slug: e.target.value }))
                }}
                onBlur={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    slug: slugify(e.target.value) || prev.slug,
                  }))
                }
                placeholder="han-river-silk"
                required
              />
              <p className="text-xs text-neutral-400">
                Spasi otomatis jadi dash &mdash; mis.{" "}
                <span className="font-mono">scarf 4</span> &rarr;{" "}
                <span className="font-mono">scarf-4</span>
              </p>
            </label>

            {/* Price */}
            <label className="block space-y-2">
              <span className="text-xs font-medium tracking-[0.14em] uppercase text-neutral-500">
                Price (IDR)
              </span>
              <input
                className={inputClassName}
                type="number"
                min={0}
                value={form.price}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, price: e.target.value }))
                }
                placeholder="79999"
                required
              />
            </label>

            {/* Category */}
            <label className="block space-y-2">
              <span className="text-xs font-medium tracking-[0.14em] uppercase text-neutral-500">
                Category
              </span>
              <input
                className={inputClassName}
                value={form.category}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, category: e.target.value }))
                }
                placeholder="solids, silk, wool, ..."
                required
              />
            </label>

            {/* Description */}
            <label className="block space-y-2">
              <span className="text-xs font-medium tracking-[0.14em] uppercase text-neutral-500">
                Description
              </span>
              <textarea
                className={`${inputClassName} min-h-28 resize-y py-3`}
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Deskripsi produk..."
              />
            </label>

            {/* Sizes */}
            <label className="block space-y-2">
              <span className="text-xs font-medium tracking-[0.14em] uppercase text-neutral-500">
                Sizes (comma separated)
              </span>
              <input
                className={inputClassName}
                value={form.sizes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, sizes: e.target.value }))
                }
                placeholder="S, M, L, XL"
              />
            </label>

            {/* Colors */}
            <label className="block space-y-2">
              <span className="text-xs font-medium tracking-[0.14em] uppercase text-neutral-500">
                Colors (comma separated)
              </span>
              <input
                className={inputClassName}
                value={form.colors}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, colors: e.target.value }))
                }
                placeholder="Navy, Cream, Sage"
              />
            </label>

            {/* Featured */}
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="size-5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                checked={form.featured}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, featured: e.target.checked }))
                }
              />
              <span className="text-sm font-medium text-neutral-700">
                Tampilkan di Homepage (Featured)
              </span>
            </label>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={submitting || !supabaseReady}
                className="h-11 w-full rounded-xl bg-neutral-900 text-[11px] tracking-[0.16em] text-white uppercase hover:bg-neutral-800"
              >
                {submitting
                  ? "Menyimpan…"
                  : isEditing
                    ? "Save Changes"
                    : "Add Product"}
              </Button>

              {isEditing ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEdit}
                  className="h-11 w-full rounded-xl border-neutral-300 text-[11px] tracking-[0.14em] uppercase"
                >
                  Cancel Edit
                </Button>
              ) : null}
            </div>
          </form>

          {/* ── Image Manager (visible when editing) ──── */}
          {isEditing && editingId ? (
            <ImageManager
              images={productImages}
              loading={imagesLoading}
              uploading={uploading}
              onUpload={handleUpload}
              onDelete={handleDeleteImage}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              fileInputRef={fileInputRef}
            />
          ) : null}
        </section>

        {/* ── Product grid ───────────────────────────────── */}
        <section className="space-y-4">
          {/* Notifications */}
          {error ? (
            <div className="whitespace-pre-line rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {message}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-xl border border-neutral-200 bg-white px-6 py-16 text-center text-sm text-neutral-500 shadow-sm">
              Memuat produk…
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-neutral-200 bg-white px-6 py-16 text-center shadow-sm">
              <p className="font-medium">Belum ada produk</p>
              <p className="mt-2 text-sm text-neutral-600">
                Tambahkan produk pertama lewat form di samping.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <article
                  key={product.id}
                  className={`overflow-hidden rounded-xl border bg-white shadow-[0_12px_40px_-28px_rgba(0,0,0,0.15)] transition hover:shadow-[0_18px_50px_-24px_rgba(0,0,0,0.22)] ${
                    editingId === product.id
                      ? "border-neutral-900 ring-1 ring-neutral-900"
                      : "border-neutral-200"
                  }`}
                >
                  {/* Cover image */}
                  <div className="relative aspect-[4/5] bg-neutral-100">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-neutral-300">
                        <ImagePlus className="size-8" />
                        <span className="text-xs tracking-[0.14em] uppercase">
                          No photo
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] tracking-[0.16em] uppercase text-neutral-500">
                          {product.category}
                        </p>
                        <h3 className="mt-1 text-base font-medium tracking-tight">
                          {product.title}
                        </h3>
                        <p className="mt-1 text-xs text-neutral-400">
                          /products/{product.slug}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-medium">
                        {formatPrice(product.price)}
                      </p>
                    </div>

                    <p className="line-clamp-2 text-sm leading-relaxed text-neutral-600">
                      {product.description || "—"}
                    </p>

                    {(product.sizes.length > 0 || product.colors.length > 0) && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {product.sizes.map(s => (
                          <span key={`size-${s}`} className="px-1.5 py-0.5 rounded-sm bg-neutral-100 text-[10px] text-neutral-600 border border-neutral-200">{s}</span>
                        ))}
                        {product.colors.map(c => (
                          <span key={`color-${c}`} className="px-1.5 py-0.5 rounded-sm bg-neutral-100 text-[10px] text-neutral-600 border border-neutral-200">{c}</span>
                        ))}
                        {product.featured && (
                          <span className="px-1.5 py-0.5 rounded-sm bg-yellow-100 text-[10px] text-yellow-700 border border-yellow-200">Featured</span>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => startEdit(product)}
                        className="h-10 rounded-xl border-neutral-300 text-[11px] tracking-[0.14em] uppercase hover:bg-neutral-900 hover:text-white"
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={deletingId === product.id}
                        onClick={() => deleteProduct(product.id)}
                        className="h-10 rounded-xl border-neutral-300 text-[11px] tracking-[0.14em] uppercase hover:bg-red-900 hover:text-white hover:border-red-900"
                      >
                        <Trash2 className="size-3.5" />
                        {deletingId === product.id ? "…" : "Delete"}
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="col-span-2 h-10 rounded-xl border-neutral-300 text-[11px] tracking-[0.14em] uppercase hover:bg-neutral-100"
                      >
                        <a href={`/products/${product.slug}`} target="_blank" rel="noopener noreferrer">
                          Preview Product
                        </a>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
