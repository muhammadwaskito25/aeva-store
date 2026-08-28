"use client"

import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import type { ProductImage } from "@/lib/products"

const BUCKET = "product-images"
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB

export function validateImageFile(file: File): string | null {
  const allowed = ["image/jpeg", "image/png", "image/webp"]
  if (!allowed.includes(file.type)) {
    return `${file.name}: hanya JPEG, PNG, atau WebP yang didukung.`
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `${file.name}: ukuran maksimal 20 MB.`
  }
  return null
}

/**
 * Resize and compress an image using the browser Canvas API.
 * - Max dimension: 2400px (preserves aspect ratio)
 * - Output: JPEG at 88% quality
 * This keeps file sizes under ~1 MB so Next.js image optimization works
 * reliably and pages load fast.
 */
async function compressImage(file: File): Promise<Blob> {
  const MAX_DIM = 2400
  const QUALITY = 0.88

  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { naturalWidth: w, naturalHeight: h } = img

      // Scale down if larger than MAX_DIM
      if (w > MAX_DIM || h > MAX_DIM) {
        if (w >= h) {
          h = Math.round((h / w) * MAX_DIM)
          w = MAX_DIM
        } else {
          w = Math.round((w / h) * MAX_DIM)
          h = MAX_DIM
        }
      }

      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        reject(new Error("Canvas tidak tersedia."))
        return
      }

      ctx.drawImage(img, 0, 0, w, h)

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error("Kompresi gambar gagal."))
        },
        "image/jpeg",
        QUALITY
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`Gagal membaca file: ${file.name}`))
    }

    img.src = objectUrl
  })
}

/** Fetch all images for a product, ordered by display_order. */
export async function fetchProductImages(
  productId: string
): Promise<ProductImage[]> {
  const supabase = createSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("product_images")
    .select("id, product_id, storage_path, url, display_order")
    .eq("product_id", productId)
    .order("display_order", { ascending: true })

  if (error) throw error
  return (data ?? []) as ProductImage[]
}

/**
 * Upload a single image file, insert a product_images row,
 * and (if it's the first image) update products.image as cover.
 */
export async function uploadProductImage(
  productId: string,
  file: File,
  displayOrder: number
): Promise<ProductImage> {
  const validationError = validateImageFile(file)
  if (validationError) throw new Error(validationError)

  const supabase = createSupabaseBrowserClient()

  // Compress & resize to JPEG before uploading — keeps files small so
  // Next.js image optimization and page load work reliably.
  const compressed = await compressImage(file)
  const storagePath = `${productId}/${crypto.randomUUID()}.jpg`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, compressed, { upsert: false, contentType: "image/jpeg" })

  if (uploadError) throw uploadError

  const {
    data: { publicUrl: url },
  } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

  const { data, error: insertError } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      storage_path: storagePath,
      url,
      display_order: displayOrder,
    })
    .select("id, product_id, storage_path, url, display_order")
    .single()

  if (insertError) {
    // Rollback: remove the uploaded file
    await supabase.storage.from(BUCKET).remove([storagePath])
    throw insertError
  }

  // If this is the cover image, sync products.image
  if (displayOrder === 0) {
    await supabase
      .from("products")
      .update({ image: url })
      .eq("id", productId)
  }

  return data as ProductImage
}

/**
 * Delete a single product image from Storage and the DB.
 * Returns the remaining images so the caller can sync the cover.
 */
export async function deleteProductImage(
  imageId: string,
  storagePath: string,
  productId: string
): Promise<ProductImage[]> {
  const supabase = createSupabaseBrowserClient()

  // Remove from Storage (best-effort — don't fail if already gone)
  await supabase.storage.from(BUCKET).remove([storagePath])

  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)

  if (deleteError) throw deleteError

  // Fetch remaining, re-assign display_order 0…n
  const remaining = await fetchProductImages(productId)
  await reassignOrders(productId, remaining)

  return remaining
}

/**
 * Move image at `fromIndex` to `toIndex` within the ordered list,
 * persist new display_order values, and sync cover on products.
 */
export async function reorderProductImages(
  productId: string,
  images: ProductImage[],
  fromIndex: number,
  toIndex: number
): Promise<ProductImage[]> {
  if (fromIndex === toIndex) return images

  const reordered = [...images]
  const [moved] = reordered.splice(fromIndex, 1)
  reordered.splice(toIndex, 0, moved)

  await reassignOrders(productId, reordered)

  return reordered.map((img, i) => ({ ...img, display_order: i }))
}

/** Re-assigns display_order 0…n and syncs products.image cover. */
async function reassignOrders(
  productId: string,
  images: ProductImage[]
): Promise<void> {
  const supabase = createSupabaseBrowserClient()

  await Promise.all(
    images.map((img, i) =>
      supabase
        .from("product_images")
        .update({ display_order: i })
        .eq("id", img.id)
    )
  )

  // Sync cover image on products table
  const coverUrl = images[0]?.url ?? ""
  await supabase
    .from("products")
    .update({ image: coverUrl })
    .eq("id", productId)
}
