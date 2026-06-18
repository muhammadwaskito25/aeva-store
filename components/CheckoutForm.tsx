"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, MapPin, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/products"
import { useCart } from "@/lib/cart"
import type { BiteshipArea, ShippingRate } from "@/lib/biteship"

// ─── Types ────────────────────────────────────────────────────────────────────

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
  firstName: string
  lastName: string
  email: string
  phone: string
  shippingName: string
  shippingPhone: string
  shippingAddress: string
  shippingCity: string
  shippingProvince: string
  shippingPostalCode: string
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputCls =
  "h-11 w-full border border-black/15 bg-[#fcfbf8] px-3 text-sm outline-none transition focus:border-black/30"
const labelCls = "space-y-2"
const labelTextCls = "block text-xs tracking-[0.12em] uppercase text-neutral-600"
const requiredMark = <span className="ml-0.5 text-red-500">*</span>

// ─── Area Autocomplete ────────────────────────────────────────────────────────

function AreaAutocomplete({
  onSelect,
}: {
  onSelect: (area: BiteshipArea) => void
}) {
  const [query, setQuery] = useState("")
  const [areas, setAreas] = useState<BiteshipArea[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedName, setSelectedName] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (value: string) => {
    if (value.trim().length < 3) {
      setAreas([])
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(
        `/api/shipping/areas?input=${encodeURIComponent(value)}`
      )
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { areas: BiteshipArea[] }
      setAreas(data.areas ?? [])
      setOpen(true)
    } catch {
      setAreas([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setQuery(value)
    setSelectedName("")

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void search(value)
    }, 450)
  }

  function handleSelect(area: BiteshipArea) {
    setSelectedName(area.name)
    setQuery(area.name)
    setOpen(false)
    setAreas([])
    onSelect(area)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
        <input
          id="areaSearch"
          type="text"
          placeholder="Ketik nama kecamatan... (min. 3 huruf)"
          value={query}
          onChange={handleChange}
          autoComplete="off"
          className={`${inputCls} pl-9 ${selectedName ? "border-black/30 bg-white" : ""}`}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-neutral-400" />
        )}
        {selectedName && !loading && (
          <CheckCircle2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-emerald-500" />
        )}
      </div>

      {open && areas.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden border border-black/10 bg-white shadow-xl">
          {areas.map((area) => (
            <button
              key={area.id}
              type="button"
              onClick={() => handleSelect(area)}
              className="flex w-full flex-col items-start px-4 py-3 text-left text-sm transition hover:bg-neutral-50 border-b border-neutral-100 last:border-0"
            >
              <span className="font-medium text-neutral-900">
                {area.administrative_division_level_3_name}
              </span>
              <span className="text-xs text-neutral-500">
                {area.administrative_division_level_2_name},{" "}
                {area.administrative_division_level_1_name} ·{" "}
                {area.postal_code}
              </span>
            </button>
          ))}
        </div>
      )}

      {open && areas.length === 0 && !loading && query.trim().length >= 3 && (
        <div className="absolute z-50 mt-1 w-full border border-black/10 bg-white px-4 py-3 shadow-xl">
          <p className="text-sm text-neutral-500">
            Kecamatan tidak ditemukan. Coba kata kunci lain.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Courier Logos (Inline SVG) ───────────────────────────────────────────────
// We render logos as inline SVG so they are 100% reliable on all environments.
// No external CDN dependency — images are embedded directly in the component.

function JneLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 24" fill="none" className={className} aria-label="JNE">
      <rect width="60" height="24" rx="4" fill="#E30613" />
      <text x="30" y="17" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="Arial,sans-serif">JNE</text>
    </svg>
  )
}

function SicepatLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 24" fill="none" className={className} aria-label="SiCepat">
      <rect width="60" height="24" rx="4" fill="#FF6600" />
      <text x="30" y="17" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="Arial,sans-serif">SiCepat</text>
    </svg>
  )
}

function AnterajaLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 24" fill="none" className={className} aria-label="AnterAja">
      <rect width="60" height="24" rx="4" fill="#F7941D" />
      <text x="30" y="17" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="bold" fontFamily="Arial,sans-serif">AnterAja</text>
    </svg>
  )
}

const COURIER_LOGO_COMPONENTS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  jne: JneLogo,
  sicepat: SicepatLogo,
  anteraja: AnterajaLogo,
}

function CourierLogo({ code, selected }: { code: string; name: string; selected: boolean }) {
  const key = code.toLowerCase()
  const LogoComponent = COURIER_LOGO_COMPONENTS[key]

  return (
    <div
      className={`flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border ${
        selected ? "border-white/20 bg-white" : "border-neutral-200 bg-white"
      }`}
    >
      {LogoComponent ? (
        <LogoComponent className="h-6 w-auto" />
      ) : (
        // Fallback — show bold initials for unknown couriers
        <span
          className={`text-[10px] font-bold uppercase tracking-wider ${
            selected ? "text-neutral-700" : "text-neutral-600"
          }`}
        >
          {key.slice(0, 3).toUpperCase()}
        </span>
      )}
    </div>
  )
}


// ─── Courier Card ─────────────────────────────────────────────────────────────

function CourierCard({
  rate,
  selected,
  onSelect,
}: {
  rate: ShippingRate
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center justify-between gap-4 border p-3.5 text-left transition ${
        selected
          ? "border-black bg-neutral-900 text-white"
          : "border-black/15 bg-[#fcfbf8] hover:border-black/30 hover:bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <CourierLogo
          code={rate.courier_code}
          name={rate.courier_name}
          selected={selected}
        />
        <div>
          <p className={`text-sm font-medium ${selected ? "text-white" : "text-neutral-900"}`}>
            {rate.courier_name} — {rate.courier_service_name}
          </p>
          <p className={`text-xs ${selected ? "text-white/70" : "text-neutral-500"}`}>
            {rate.duration}
          </p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-sm font-semibold ${selected ? "text-white" : "text-neutral-900"}`}>
          {formatPrice(rate.price)}
        </p>
        {selected && (
          <p className="text-[10px] tracking-widest uppercase text-white/70 mt-0.5">
            Dipilih ✓
          </p>
        )}
      </div>
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CheckoutForm({
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

  // ── Biteship State ──────────────────────────────────────────────────────────
  const [destinationAreaId, setDestinationAreaId] = useState<string | null>(null)
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([])
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null)
  const [ratesLoading, setRatesLoading] = useState(false)
  const [ratesError, setRatesError] = useState<string | null>(null)

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

  const totalQuantity = cartItems.reduce((t, i) => t + i.quantity, 0)
  const shippingFee = selectedRate?.price ?? 0
  const total = subtotal > 0 ? subtotal + shippingFee : 0

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // ── Load Midtrans Snap ──────────────────────────────────────────────────────
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

  // ── Fetch rates when area selected ─────────────────────────────────────────
  async function fetchRates(areaId: string) {
    setRatesLoading(true)
    setRatesError(null)
    setSelectedRate(null)
    setShippingRates([])

    try {
      const res = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination_area_id: areaId,
          total_quantity: totalQuantity,
        }),
      })

      const data = (await res.json()) as { rates?: ShippingRate[]; error?: string }

      if (!res.ok || !data.rates) {
        throw new Error(data.error ?? "Gagal mengambil ongkir.")
      }

      setShippingRates(data.rates)

      if (data.rates.length === 0) {
        setRatesError("Tidak ada kurir yang tersedia untuk area ini.")
      }
    } catch (err) {
      setRatesError(err instanceof Error ? err.message : "Gagal mengambil ongkir.")
    } finally {
      setRatesLoading(false)
    }
  }

  function handleAreaSelect(area: BiteshipArea) {
    setDestinationAreaId(area.id)
    setField("shippingCity", area.administrative_division_level_2_name)
    setField("shippingProvince", area.administrative_division_level_1_name)
    setField("shippingPostalCode", String(area.postal_code))
    void fetchRates(area.id)
  }

  // ── Validate ────────────────────────────────────────────────────────────────
  function validate(): string | null {
    if (!form.firstName.trim()) return "Nama depan wajib diisi."
    if (!form.email.trim()) return "Email wajib diisi."
    if (!form.shippingName.trim()) return "Nama penerima wajib diisi."
    if (!form.shippingPhone.trim()) return "Nomor HP penerima wajib diisi."
    if (!form.shippingAddress.trim()) return "Alamat pengiriman wajib diisi."
    if (!destinationAreaId) return "Pilih kecamatan tujuan pengiriman."
    if (!selectedRate) return "Pilih kurir pengiriman terlebih dahulu."
    return null
  }

  // ── Save Order ──────────────────────────────────────────────────────────────
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
        shipping_city: form.shippingCity,
        shipping_province: form.shippingProvince,
        shipping_postal_code: form.shippingPostalCode,
        // Biteship fields
        courier: selectedRate?.courier_name ?? null,
        courier_code: selectedRate?.courier_code ?? null,
        shipping_service: selectedRate?.courier_service_name ?? null,
        destination_area_id: destinationAreaId,
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

  // ── Handle Pay ──────────────────────────────────────────────────────────────
  async function handlePay() {
    setError(null)
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsPaying(true)

    try {
      const orderNumber = await saveOrder()
      orderNumberRef.current = orderNumber

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
            setError("Pembayaran gagal. Pesanan Anda sudah tersimpan dan bisa dibayar nanti.")
            setIsPaying(false)
          },
          onClose: () => {
            clearCart()
            router.push(`/account/orders/${orderNumber}`)
          },
        })
      } else {
        clearCart()
        router.push(`/account/orders/${orderNumber}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.")
      setIsPaying(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="space-y-8">
        {/* ── Step 1: Customer Information ─────────────────── */}
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
            <label className={labelCls}>
              <span className={labelTextCls}>Nama Depan {requiredMark}</span>
              <input
                id="firstName"
                type="text"
                placeholder="Aeva"
                value={form.firstName}
                onChange={(e) => setField("firstName", e.target.value)}
                className={inputCls}
              />
            </label>

            <label className={labelCls}>
              <span className={labelTextCls}>Nama Belakang</span>
              <input
                id="lastName"
                type="text"
                placeholder="Studio"
                value={form.lastName}
                onChange={(e) => setField("lastName", e.target.value)}
                className={inputCls}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className={labelTextCls}>Email {requiredMark}</span>
              <input
                id="email"
                type="email"
                required
                placeholder="hello@aeva.store"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className={inputCls}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className={labelTextCls}>Nomor HP (Opsional)</span>
              <input
                id="phone"
                type="tel"
                placeholder="+62 812 0000 0000"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                className={inputCls}
              />
            </label>
          </div>
        </section>

        {/* ── Step 2: Shipping Address ─────────────────────── */}
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
            <label className={labelCls}>
              <span className={labelTextCls}>Nama Penerima {requiredMark}</span>
              <input
                id="shippingName"
                type="text"
                placeholder="Nama lengkap penerima"
                value={form.shippingName}
                onChange={(e) => setField("shippingName", e.target.value)}
                className={inputCls}
              />
            </label>

            <label className={labelCls}>
              <span className={labelTextCls}>HP Penerima {requiredMark}</span>
              <input
                id="shippingPhone"
                type="tel"
                placeholder="+62 812 0000 0000"
                value={form.shippingPhone}
                onChange={(e) => setField("shippingPhone", e.target.value)}
                className={inputCls}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className={labelTextCls}>
                Alamat Lengkap {requiredMark}
              </span>
              <input
                id="shippingAddress"
                type="text"
                placeholder="Jl. Sudirman No. 12, Apt. 3B"
                value={form.shippingAddress}
                onChange={(e) => setField("shippingAddress", e.target.value)}
                className={inputCls}
              />
            </label>

            {/* Area Autocomplete */}
            <div className="space-y-2 sm:col-span-2">
              <span className={labelTextCls}>
                Kecamatan {requiredMark}
                <span className="ml-1.5 font-normal normal-case text-neutral-400">
                  — ketik untuk cari
                </span>
              </span>
              <AreaAutocomplete onSelect={handleAreaSelect} />
            </div>

            {/* Auto-filled fields */}
            <label className={labelCls}>
              <span className={labelTextCls}>Kota / Kabupaten</span>
              <input
                id="shippingCity"
                type="text"
                readOnly
                placeholder="Terisi otomatis"
                value={form.shippingCity}
                className={`${inputCls} text-neutral-500 bg-neutral-50 cursor-not-allowed`}
              />
            </label>

            <label className={labelCls}>
              <span className={labelTextCls}>Provinsi</span>
              <input
                id="shippingProvince"
                type="text"
                readOnly
                placeholder="Terisi otomatis"
                value={form.shippingProvince}
                className={`${inputCls} text-neutral-500 bg-neutral-50 cursor-not-allowed`}
              />
            </label>

            <label className={labelCls}>
              <span className={labelTextCls}>Kode Pos</span>
              <input
                id="shippingPostalCode"
                type="text"
                readOnly
                placeholder="Terisi otomatis"
                value={form.shippingPostalCode}
                className={`${inputCls} text-neutral-500 bg-neutral-50 cursor-not-allowed`}
              />
            </label>

            <label className={labelCls}>
              <span className={labelTextCls}>Negara</span>
              <input
                type="text"
                value="Indonesia"
                readOnly
                className={`${inputCls} text-neutral-500 bg-neutral-50 cursor-not-allowed`}
              />
            </label>
          </div>
        </section>

        {/* ── Step 3: Pilih Kurir ───────────────────────────── */}
        <section className="space-y-5 border border-black/10 bg-white p-5 sm:p-6">
          <div className="space-y-1">
            <p className="text-[11px] tracking-[0.14em] uppercase text-neutral-500">
              Step 3
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl">
              Pilih Kurir
            </h2>
          </div>

          {!destinationAreaId && (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-5 text-sm text-neutral-500">
              <Package className="size-5 shrink-0 text-neutral-400" />
              Pilih kecamatan tujuan di Step 2 untuk melihat pilihan kurir dan ongkir.
            </div>
          )}

          {ratesLoading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-neutral-500">
              <Loader2 className="size-5 animate-spin text-neutral-400" />
              Mengecek ongkir...
            </div>
          )}

          {ratesError && !ratesLoading && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{ratesError}</p>
            </div>
          )}

          {!ratesLoading && !ratesError && shippingRates.length > 0 && (
            <div className="space-y-2.5">
              {shippingRates.map((rate) => (
                <CourierCard
                  key={`${rate.courier_code}-${rate.courier_service_name}`}
                  rate={rate}
                  selected={
                    selectedRate?.courier_code === rate.courier_code &&
                    selectedRate?.courier_service_name === rate.courier_service_name
                  }
                  onSelect={() => setSelectedRate(rate)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Step 4: Customer Note ─────────────────────────── */}
        <section className="space-y-4 border border-black/10 bg-white p-5 sm:p-6">
          <div className="space-y-1">
            <p className="text-[11px] tracking-[0.14em] uppercase text-neutral-500">
              Step 4
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl">
              Catatan Pesanan
            </h2>
          </div>

          <label className="space-y-2">
            <span className={labelTextCls}>
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

      {/* ── Order Summary Aside ────────────────────────────────── */}
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
                <p className="shrink-0">{formatPrice(item.price * item.quantity)}</p>
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
            {selectedRate ? (
              <div className="text-right">
                <span className="block">{formatPrice(selectedRate.price)}</span>
                <span className="text-[10px] text-neutral-500">
                  {selectedRate.courier_name} {selectedRate.courier_service_name}
                </span>
              </div>
            ) : (
              <span className="text-neutral-400 italic text-xs">
                {destinationAreaId ? "Pilih kurir" : "Pilih area dulu"}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-black/10 pt-3 text-base">
            <span>Total</span>
            <span className="font-medium">
              {selectedRate ? formatPrice(total) : "—"}
            </span>
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
          disabled={isPaying || orderItems.length === 0 || !selectedRate}
          onClick={handlePay}
          className="h-11 w-full bg-neutral-900 text-[11px] tracking-[0.14em] text-white uppercase hover:bg-neutral-800 disabled:opacity-50"
        >
          {isPaying
            ? "Memproses..."
            : midtransEnabled
            ? "Lanjut ke Pembayaran"
            : "Buat Pesanan"}
        </Button>

        {!selectedRate && orderItems.length > 0 && (
          <p className="text-center text-xs text-neutral-400">
            Pilih kurir untuk melanjutkan
          </p>
        )}
      </aside>
    </>
  )
}
