"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { LogOut, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/products"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { isSupabaseConfigured } from "@/lib/supabase"

type AdminProduct = {
  id: string
  title: string
  slug: string
  price: number
  description: string
  image: string
  category: string
}

type ProductFormState = {
  title: string
  slug: string
  price: string
  image: string
  category: string
  description: string
}

const emptyForm: ProductFormState = {
  title: "",
  slug: "",
  price: "",
  image: "",
  category: "",
  description: "",
}

const inputClassName =
  "h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900"

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Supabase/PostgREST errors carry message, code, details, hint */
function formatError(err: unknown, fallback: string): string {
  console.error("[admin]", err)

  if (err && typeof err === "object") {
    const e = err as {
      message?: string
      code?: string
      details?: string
      hint?: string
    }
    const parts = [e.message, e.details, e.hint, e.code ? `(${e.code})` : ""].filter(
      Boolean
    )
    if (parts.length > 0) return parts.join(" — ")
  }

  if (err instanceof Error && err.message) return err.message
  return fallback
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
  }
}

function productToForm(product: AdminProduct): ProductFormState {
  return {
    title: product.title,
    slug: product.slug,
    price: String(product.price),
    image: product.image,
    category: product.category,
    description: product.description,
  }
}

export default function AdminPage() {
  const router = useRouter()
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [form, setForm] = useState<ProductFormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [slugTouched, setSlugTouched] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const supabaseReady = useMemo(() => isSupabaseConfigured(), [])
  const isEditing = editingId !== null

  const fetchProducts = useCallback(async () => {
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

  const parseForm = () => {
    const title = form.title.trim()
    const slug = slugify(form.slug.trim() || title)
    const price = Number(form.price)
    const image = form.image.trim()
    const category = form.category.trim()
    const description = form.description.trim()

    if (!title || !slug || !image || !category || Number.isNaN(price)) {
      throw new Error("Lengkapi title, slug, price, image, dan category.")
    }

    return { title, slug, price, image, category, description }
  }

  const addProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      const payload = parseForm()
      const supabase = createSupabaseBrowserClient()
      const { error: insertError } = await supabase.from("products").insert(payload)

      if (insertError) throw insertError

      setForm(emptyForm)
      setSlugTouched(false)
      setMessage("Produk berhasil ditambahkan.")
      await fetchProducts()
    } catch (err) {
      setError(formatError(err, "Gagal menambah produk."))
    } finally {
      setSubmitting(false)
    }
  }

  const updateProduct = async (event: React.FormEvent<HTMLFormElement>) => {
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

      setForm(emptyForm)
      setEditingId(null)
      setSlugTouched(false)
      setMessage("Produk berhasil diperbarui.")
      await fetchProducts()
    } catch (err) {
      setError(formatError(err, "Gagal memperbarui produk."))
    } finally {
      setSubmitting(false)
    }
  }

  const deleteProduct = async (id: string) => {
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

      if (editingId === id) {
        setEditingId(null)
        setForm(emptyForm)
      }

      setMessage("Produk dihapus.")
      await fetchProducts()
    } catch (err) {
      setError(formatError(err, "Gagal menghapus produk."))
    } finally {
      setDeletingId(null)
    }
  }

  const startEdit = (product: AdminProduct) => {
    setEditingId(product.id)
    setSlugTouched(true)
    setForm(productToForm(product))
    setError(null)
    setMessage(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(emptyForm)
    setSlugTouched(false)
  }

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
    router.refresh()
  }

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

        setUserEmail(user.email ?? null)
        await fetchProducts()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat sesi admin.")
      } finally {
        setAuthLoading(false)
      }
    }

    void init()
  }, [fetchProducts, router, supabaseReady])

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 text-sm text-neutral-500">
        Memuat dashboard...
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
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
              Kelola katalog produk — tambah, edit, dan hapus.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {userEmail ? (
              <p className="text-sm text-neutral-500">{userEmail}</p>
            ) : null}
            <p className="text-sm text-neutral-500">{products.length} produk</p>
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

      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[380px_1fr] lg:gap-10">
        <section className="h-fit rounded-xl border border-neutral-200 bg-white p-6 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.18)] lg:sticky lg:top-8">
          <h2 className="text-lg font-medium tracking-tight">
            {isEditing ? "Edit Product" : "Add Product"}
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            {isEditing
              ? "Perbarui detail produk lalu simpan."
              : "Produk baru langsung tampil di storefront."}
          </p>

          <form
            onSubmit={isEditing ? updateProduct : addProduct}
            className="mt-6 space-y-4"
          >
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
                placeholder="han-river-silk atau scarf-4"
                required
              />
              <p className="text-xs text-neutral-500">
                Boleh huruf, angka, spasi. Saat simpan, spasi jadi strip (-), mis.{" "}
                <span className="font-mono">scarf 4</span> →{" "}
                <span className="font-mono">scarf-4</span>
              </p>
            </label>

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

            <label className="block space-y-2">
              <span className="text-xs font-medium tracking-[0.14em] uppercase text-neutral-500">
                Image URL / Path
              </span>
              <input
                className={inputClassName}
                value={form.image}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, image: e.target.value }))
                }
                placeholder="/products/scarf1.png"
                required
              />
            </label>

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
                placeholder="silk"
                required
              />
            </label>

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

            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={submitting || !supabaseReady}
                className="h-11 w-full rounded-xl bg-neutral-900 text-[11px] tracking-[0.16em] text-white uppercase hover:bg-neutral-800"
              >
                {submitting
                  ? "Menyimpan..."
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
        </section>

        <section className="space-y-4">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 shadow-sm">
              {message}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-xl border border-neutral-200 bg-white px-6 py-16 text-center text-sm text-neutral-500 shadow-sm">
              Memuat produk...
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
                      <div className="flex h-full items-center justify-center text-xs tracking-[0.14em] uppercase text-neutral-400">
                        No image
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
                        <p className="mt-1 text-xs text-neutral-500">
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

                    <div className="grid grid-cols-2 gap-2">
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
                        className="h-10 rounded-xl border-neutral-300 text-[11px] tracking-[0.14em] uppercase hover:bg-neutral-900 hover:text-white"
                      >
                        <Trash2 className="size-3.5" />
                        {deletingId === product.id ? "..." : "Delete"}
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
