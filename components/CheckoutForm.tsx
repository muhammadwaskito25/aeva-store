"use client"

import { useEffect, useState } from "react"
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

const inputClassName =
  "h-11 w-full border border-black/15 bg-[#fcfbf8] px-3 text-sm outline-none transition focus:border-black/30"

export function CheckoutForm({
  shippingFee,
  midtransClientKey,
  midtransScriptUrl,
  midtransEnabled,
}: CheckoutFormProps) {
  const router = useRouter()
  const { items: cartItems, subtotal, clearCart } = useCart()

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

  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [snapReady, setSnapReady] = useState(false)

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

  async function handlePay() {
    setError(null)

    const firstName =
      (document.getElementById("firstName") as HTMLInputElement)?.value.trim() ||
      "AEVA"
    const lastName =
      (document.getElementById("lastName") as HTMLInputElement)?.value.trim() ||
      "Customer"
    const email = (document.getElementById("email") as HTMLInputElement)?.value.trim()
    const phone = (document.getElementById("phone") as HTMLInputElement)?.value.trim()

    if (!email) {
      setError("Email wajib diisi untuk pembayaran.")
      return
    }

    if (!midtransEnabled || !snapReady || !window.snap) {
      setError("Midtrans belum siap. Cek konfigurasi environment variable.")
      return
    }

    setIsPaying(true)

    try {
      const response = await fetch("/api/midtrans/snap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { firstName, lastName, email, phone },
          items: orderItems.map((item) => ({
            id: item.id,
            name: item.title,
            price: item.price,
            quantity: item.quantity,
          })),
          shipping: shippingFee,
        }),
      })

      const data = (await response.json()) as { token?: string; error?: string }

      if (!response.ok || !data.token) {
        throw new Error(data.error ?? "Gagal membuat token pembayaran.")
      }

      window.snap.pay(data.token, {
        onSuccess: () => {
          clearCart()
          router.push("/checkout/success")
        },
        onPending: () => {
          clearCart()
          router.push("/checkout/success?status=pending")
        },
        onError: () => {
          setError("Pembayaran gagal. Silakan coba lagi.")
        },
        onClose: () => {
          setIsPaying(false)
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.")
      setIsPaying(false)
    }
  }

  return (
    <>
      <div className="space-y-8">
        <section className="space-y-5 border border-black/10 bg-white p-5 sm:p-6">
          <div className="space-y-1">
            <p className="text-[11px] tracking-[0.14em] uppercase text-neutral-500">
              Step 1
            </p>
            <h1 className="font-heading text-2xl sm:text-3xl">
              Customer Information
            </h1>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-1">
              <span className="text-xs tracking-[0.12em] uppercase text-neutral-600">
                First Name
              </span>
              <input
                id="firstName"
                type="text"
                placeholder="Aeva"
                className={inputClassName}
              />
            </label>

            <label className="space-y-2 sm:col-span-1">
              <span className="text-xs tracking-[0.12em] uppercase text-neutral-600">
                Last Name
              </span>
              <input
                id="lastName"
                type="text"
                placeholder="Studio"
                className={inputClassName}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs tracking-[0.12em] uppercase text-neutral-600">
                Email
              </span>
              <input
                id="email"
                type="email"
                required
                placeholder="hello@aeva.store"
                className={inputClassName}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs tracking-[0.12em] uppercase text-neutral-600">
                Phone
              </span>
              <input
                id="phone"
                type="tel"
                placeholder="+62 812 0000 0000"
                className={inputClassName}
              />
            </label>
          </div>
        </section>

        <section className="space-y-5 border border-black/10 bg-white p-5 sm:p-6">
          <div className="space-y-1">
            <p className="text-[11px] tracking-[0.14em] uppercase text-neutral-500">
              Step 2
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl">Shipping Address</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs tracking-[0.12em] uppercase text-neutral-600">
                Street Address
              </span>
              <input type="text" placeholder="Jl. Sudirman No. 12" className={inputClassName} />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs tracking-[0.12em] uppercase text-neutral-600">
                Apartment / Suite
              </span>
              <input
                type="text"
                placeholder="Unit, floor, etc. (optional)"
                className={inputClassName}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs tracking-[0.12em] uppercase text-neutral-600">
                City
              </span>
              <input type="text" placeholder="Jakarta" className={inputClassName} />
            </label>

            <label className="space-y-2">
              <span className="text-xs tracking-[0.12em] uppercase text-neutral-600">
                Postal Code
              </span>
              <input type="text" placeholder="10220" className={inputClassName} />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs tracking-[0.12em] uppercase text-neutral-600">
                Country
              </span>
              <input type="text" placeholder="Indonesia" className={inputClassName} />
            </label>
          </div>
        </section>
      </div>

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
            <span>Shipping</span>
            <span>{formatPrice(shippingFee)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-black/10 pt-3 text-base">
            <span>Total</span>
            <span className="font-medium">{formatPrice(total)}</span>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-red-700">{error}</p>
        ) : null}

        {!midtransEnabled ? (
          <p className="text-xs text-neutral-600">
            Midtrans belum dikonfigurasi. Tambahkan key di environment variables.
          </p>
        ) : null}

        <Button
          type="button"
          disabled={isPaying || orderItems.length === 0 || !midtransEnabled}
          onClick={handlePay}
          className="h-11 w-full bg-neutral-900 text-[11px] tracking-[0.14em] text-white uppercase hover:bg-neutral-800 disabled:opacity-50"
        >
          {isPaying ? "Memproses..." : "Bayar dengan Midtrans"}
        </Button>
      </aside>
    </>
  )
}
