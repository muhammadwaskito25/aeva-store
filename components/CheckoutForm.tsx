"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/products"
import { useCart } from "@/lib/cart"

export type CheckoutOrderItem = {
  id: string
  title: string
  detail: string
  price: number
  quantity: number
}

type CheckoutFormProps = {
  shippingFee: number
  midtransClientKey: string | null
  midtransScriptUrl: string
  midtransEnabled: boolean
}

type FormData = {
  // Customer Info
  firstName: string
  lastName: string
  email: string
  phone: string
  // Shipping Address
  shippingName: string
  shippingPhone: string
  shippingAddress: string
  shippingCity: string
  shippingProvince: string
  shippingPostalCode: string
  // Notes
  customerNote: string
}

const initialForm: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  shippingName: "",
  shippingPhone: "",
  shippingAddress: "",
  shippingCity: "",
  shippingProvince: "",
  shippingPostalCode: "",
  customerNote: "",
}

const inputClassName =
  "h-11 w-full border border-black/15 bg-[#fcfbf8] px-3 text-sm outline-none transition focus:border-black/30"

const labelClassName = "space-y-2"
const labelTextClassName =
  "block text-xs tracking-[0.12em] uppercase text-neutral-600"
const requiredMark = <span className="ml-0.5 text-red-500">*</span>

export function CheckoutForm({
  shippingFee,
  midtransClientKey,
  midtransScriptUrl,
  midtransEnabled,
}: CheckoutFormProps) {
  const router = useRouter()
  const { items: cartItems, subtotal, clearCart } = useCart()
  const [form, setForm] = useState<FormData>(initialForm)
  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [snapReady, setSnapReady] = useState(false)
  const orderNumberRef = useRef<string | null>(null)

  const orderItems: CheckoutOrderItem[] = cartItems.map((item) => ({
    id: item.id,
    title: item.title,
    detail:
      item.selectedColor && item.selectedSize
        ? `${item.selectedColor} · ${item.selectedSize}`
        : item.colors?.[0] && item.sizes?.[0]
        ? `${item.colors[0]} · ${item.sizes[0]}`
        : item.category,
    price: item.price,
    quantity: item.quantity,
  }))

  const total = subtotal > 0 ? subtotal + shippingFee : 0

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // ── Load Midtrans Snap script ─────────────────────────────
  useEffect(() => {
    if (!midtransEnabled || !midtransClientKey) return

    const existing = document.querySelector('script[data-midtrans-snap="true"]')
    if (existing) {
      queueMicrotask(() => {
        if (window.snap) setSnapReady(true)
      })
      return
    }

    const script = document.createElement("script")
    script.src = midtransScriptUrl
    script.setAttribute("data-client-key", midtransClientKey)
    script.setAttribute("data-midtrans-snap", "true")
    script.async = true
    script.onload = () => setSnapReady(true)
    script.onerror = () => setError("Gagal memuat Midtrans Snap.")
    document.body.appendChild(script)

    return () => {
      script.remove()
    }
  }, [midtransClientKey, midtransEnabled, midtransScriptUrl])

  // ── Validate form ─────────────────────────────────────────

  function validate(): string | null {
    if (!form.firstName.trim()) return "Nama depan wajib diisi."
    if (!form.email.trim()) return "Email wajib diisi."
    if (!form.shippingName.trim()) return "Nama penerima wajib diisi."
    if (!form.shippingPhone.trim()) return "Nomor HP penerima wajib diisi."
    if (!form.shippingAddress.trim()) return "Alamat pengiriman wajib diisi."
    if (!form.shippingCity.trim()) return "Kota wajib diisi."
    if (!form.shippingProvince.trim()) return "Provinsi wajib diisi."
    if (!form.shippingPostalCode.trim()) return "Kode pos wajib diisi."
    return null
  }

  // ── Save order to DB (Step 1 — always, before Midtrans) ───

  async function saveOrder(): Promise<string> {
    const customerName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim()

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: customerName,
        customer_email: form.email.trim(),
        customer_note: form.customerNote.trim() || null,
        subtotal,
        shipping_fee: shippingFee,
        total,
        shipping_name: form.shippingName.trim(),
        shipping_phone: form.shippingPhone.trim(),
        shipping_address: form.shippingAddress.trim(),
        shipping_city: form.shippingCity.trim(),
        shipping_province: form.shippingProvince.trim(),
        shipping_postal_code: form.shippingPostalCode.trim(),
        items: cartItems.map((item) => ({
          product_id: item.id,
          product_name: item.title,
          product_image: item.image ?? "",
          selected_size: item.selectedSize ?? null,
          selected_color: item.selectedColor ?? null,
          quantity: item.quantity,
          price: item.price,
        })),
      }),
    })

    const data = (await response.json()) as {
      order_number?: string
      error?: string
    }

    if (!response.ok || !data.order_number) {
      throw new Error(data.error ?? "Gagal membuat pesanan.")
    }

    return data.order_number
  }

  // ── Main payment handler ──────────────────────────────────

  async function handlePay() {
    setError(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsPaying(true)

    try {
      // Step 1: Always save order first (status = Pending)
      const orderNumber = await saveOrder()
      orderNumberRef.current = orderNumber

      // Step 2: If Midtrans is configured, open Snap popup
      if (midtransEnabled && snapReady && window.snap) {
        const customerName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim()

        const response = await fetch("/api/midtrans/snap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer: {
              firstName: form.firstName.trim(),
              lastName: form.lastName.trim(),
              email: form.email.trim(),
              phone: form.phone.trim() || form.shippingPhone.trim(),
            },
            items: orderItems.map((item) => ({
              id: item.id,
              name: item.title,
              price: item.price,
              quantity: item.quantity,
            })),
            shipping: shippingFee,
            orderNumber,
            customerName,
          }),
        })

        const snapData = (await response.json()) as {
          token?: string
          error?: string
        }

        if (!response.ok || !snapData.token) {
          throw new Error(snapData.error ?? "Gagal membuat token pembayaran.")
        }

        window.snap.pay(snapData.token, {
          onSuccess: () => {
            clearCart()
            router.push(`/account/orders/${orderNumber}?status=paid`)
          },
          onPending: () => {
            clearCart()
            router.push(`/account/orders/${orderNumber}?status=pending`)
          },
          onError: () => {
            // Order already saved as Pending — user can retry later
            setError(
              "Pembayaran gagal. Pesanan Anda sudah tersimpan dan bisa dibayar nanti."
            )
            setIsPaying(false)
          },
          onClose: () => {
            // Order already saved — redirect to order detail
            clearCart()
            router.push(`/account/orders/${orderNumber}`)
          },
        })
      } else {
        // Midtrans not configured — order saved as Pending, redirect to orders
        clearCart()
        router.push(`/account/orders/${orderNumber}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.")
      setIsPaying(false)
    }
  }

  return (
    <>
      <div className="space-y-8">
        {/* ── Step 1: Customer Information ───────────────── */}
        <section className="space-y-5 border border-black/10 bg-white p-5 sm:p-6">
          <div className="space-y-1">
            <p className="text-[11px] tracking-[0.14em] uppercase text-neutral-500">
              Step 1
            </p>
            <h1 className="font-heading text-2xl sm:text-3xl">
              Informasi Pelanggan
            </h1>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClassName}>
              <span className={labelTextClassName}>
                Nama Depan {requiredMark}
              </span>
              <input
                id="firstName"
                type="text"
                placeholder="Aeva"
                value={form.firstName}
                onChange={(e) => setField("firstName", e.target.value)}
                className={inputClassName}
              />
            </label>

            <label className={labelClassName}>
              <span className={labelTextClassName}>Nama Belakang</span>
              <input
                id="lastName"
                type="text"
                placeholder="Studio"
                value={form.lastName}
                onChange={(e) => setField("lastName", e.target.value)}
                className={inputClassName}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className={labelTextClassName}>Email {requiredMark}</span>
              <input
                id="email"
                type="email"
                required
                placeholder="hello@aeva.store"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className={inputClassName}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className={labelTextClassName}>
                Nomor HP (Opsional)
              </span>
              <input
                id="phone"
                type="tel"
                placeholder="+62 812 0000 0000"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                className={inputClassName}
              />
            </label>
          </div>
        </section>

        {/* ── Step 2: Shipping Address ────────────────────── */}
        <section className="space-y-5 border border-black/10 bg-white p-5 sm:p-6">
          <div className="space-y-1">
            <p className="text-[11px] tracking-[0.14em] uppercase text-neutral-500">
              Step 2
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl">
              Alamat Pengiriman
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClassName}>
              <span className={labelTextClassName}>
                Nama Penerima {requiredMark}
              </span>
              <input
                id="shippingName"
                type="text"
                placeholder="Nama lengkap penerima"
                value={form.shippingName}
                onChange={(e) => setField("shippingName", e.target.value)}
                className={inputClassName}
              />
            </label>

            <label className={labelClassName}>
              <span className={labelTextClassName}>
                HP Penerima {requiredMark}
              </span>
              <input
                id="shippingPhone"
                type="tel"
                placeholder="+62 812 0000 0000"
                value={form.shippingPhone}
                onChange={(e) => setField("shippingPhone", e.target.value)}
                className={inputClassName}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className={labelTextClassName}>
                Alamat Lengkap {requiredMark}
              </span>
              <input
                id="shippingAddress"
                type="text"
                placeholder="Jl. Sudirman No. 12, Apt. 3B"
                value={form.shippingAddress}
                onChange={(e) => setField("shippingAddress", e.target.value)}
                className={inputClassName}
              />
            </label>

            <label className={labelClassName}>
              <span className={labelTextClassName}>Kota {requiredMark}</span>
              <input
                id="shippingCity"
                type="text"
                placeholder="Jakarta"
                value={form.shippingCity}
                onChange={(e) => setField("shippingCity", e.target.value)}
                className={inputClassName}
              />
            </label>

            <label className={labelClassName}>
              <span className={labelTextClassName}>
                Provinsi {requiredMark}
              </span>
              <input
                id="shippingProvince"
                type="text"
                placeholder="DKI Jakarta"
                value={form.shippingProvince}
                onChange={(e) => setField("shippingProvince", e.target.value)}
                className={inputClassName}
              />
            </label>

            <label className={labelClassName}>
              <span className={labelTextClassName}>
                Kode Pos {requiredMark}
              </span>
              <input
                id="shippingPostalCode"
                type="text"
                placeholder="10220"
                value={form.shippingPostalCode}
                onChange={(e) =>
                  setField("shippingPostalCode", e.target.value)
                }
                className={inputClassName}
              />
            </label>

            <label className={labelClassName}>
              <span className={labelTextClassName}>Negara</span>
              <input
                type="text"
                value="Indonesia"
                readOnly
                className={`${inputClassName} text-neutral-500`}
              />
            </label>
          </div>
        </section>

        {/* ── Step 3: Customer Note ───────────────────────── */}
        <section className="space-y-4 border border-black/10 bg-white p-5 sm:p-6">
          <div className="space-y-1">
            <p className="text-[11px] tracking-[0.14em] uppercase text-neutral-500">
              Step 3
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl">
              Catatan Pesanan
            </h2>
          </div>

          <label className="space-y-2">
            <span className={labelTextClassName}>
              Catatan untuk AÉVA (Opsional)
            </span>
            <textarea
              id="customerNote"
              rows={3}
              placeholder="Contoh: Tolong bungkus sebagai kado, atau instruksi pengiriman khusus."
              value={form.customerNote}
              onChange={(e) => setField("customerNote", e.target.value)}
              className="w-full border border-black/15 bg-[#fcfbf8] px-3 py-2.5 text-sm outline-none transition focus:border-black/30 resize-none"
            />
          </label>
        </section>
      </div>

      {/* ── Order Summary Aside ─────────────────────────────── */}
      <aside className="h-fit space-y-5 border border-black/10 bg-white p-5 sm:p-6 lg:sticky lg:top-24">
        <div className="space-y-1">
          <p className="text-[11px] tracking-[0.14em] uppercase text-neutral-500">
            Order
          </p>
          <h2 className="font-heading text-2xl">Summary</h2>
        </div>

        <div className="space-y-3 border-y border-black/10 py-4">
          {orderItems.length === 0 ? (
            <p className="text-sm text-neutral-600">
              Belum ada produk. Tambahkan dari halaman utama.
            </p>
          ) : (
            orderItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <div>
                  <p>{item.title}</p>
                  <p className="text-xs text-neutral-600">
                    {item.detail} · Qty {item.quantity}
                  </p>
                </div>
                <p>{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between text-neutral-700">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-neutral-700">
            <span>Ongkir</span>
            <span>{formatPrice(shippingFee)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-black/10 pt-3 text-base">
            <span>Total</span>
            <span className="font-medium">{formatPrice(total)}</span>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        ) : null}

        {!midtransEnabled ? (
          <p className="text-xs text-neutral-500 leading-relaxed">
            Pembayaran online belum tersedia. Pesanan Anda akan tersimpan dan
            tim kami akan menghubungi Anda untuk konfirmasi pembayaran.
          </p>
        ) : null}

        <Button
          type="button"
          disabled={isPaying || orderItems.length === 0}
          onClick={handlePay}
          className="h-11 w-full bg-neutral-900 text-[11px] tracking-[0.14em] text-white uppercase hover:bg-neutral-800 disabled:opacity-50"
        >
          {isPaying
            ? "Memproses..."
            : midtransEnabled
            ? "Lanjut ke Pembayaran"
            : "Buat Pesanan"}
        </Button>
      </aside>
    </>
  )
}
