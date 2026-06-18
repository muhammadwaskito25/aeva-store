"use client"

import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import {
  CheckCircle2,
  Circle,
  Clock,
  Package,
  Save,
  Truck,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { fetchOrderByNumberAdmin } from "@/lib/orders.repository"
import {
  formatOrderDate,
  formatOrderDateTime,
  getOrderStatusColor,
  getOrderStatusLabel,
  getPaymentStatusColor,
  getPaymentStatusLabel,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from "@/lib/orders"
import { formatPrice } from "@/lib/products"
import type { Order, OrderStatus, PaymentStatus } from "@/lib/orders"

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({
  label,
  colors,
}: {
  label: string
  colors: { bg: string; text: string; dot: string }
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] uppercase ${colors.bg} ${colors.text}`}
    >
      <span className={`size-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  )
}

// ─── Order Timeline ───────────────────────────────────────────────────────────

function OrderTimeline({ order }: { order: Order }) {
  const isCancelled = order.order_status === "Cancelled"

  const steps = [
    {
      label: "Pesanan Dibuat",
      timestamp: order.created_at,
      icon: <Package className="size-3.5" />,
      done: true,
    },
    {
      label: "Pembayaran Lunas",
      timestamp: order.paid_at,
      icon: <CheckCircle2 className="size-3.5" />,
      done: order.payment_status === "Paid",
    },
    {
      label: "Sedang Diproses",
      timestamp: order.processing_at,
      icon: <Clock className="size-3.5" />,
      done: !!order.processing_at,
    },
    {
      label: "Dikirim",
      timestamp: order.shipped_at,
      icon: <Truck className="size-3.5" />,
      done: !!order.shipped_at,
    },
    {
      label: "Diterima",
      timestamp: order.delivered_at,
      icon: <CheckCircle2 className="size-3.5" />,
      done: !!order.delivered_at,
    },
    ...(isCancelled
      ? [
          {
            label: "Dibatalkan",
            timestamp: order.cancelled_at,
            icon: <XCircle className="size-3.5" />,
            done: true,
            cancelled: true,
          },
        ]
      : []),
  ]

  return (
    <div className="space-y-0">
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1
        return (
          <div key={step.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                  (step as { cancelled?: boolean }).cancelled
                    ? "border-red-300 bg-red-50 text-red-500"
                    : step.done
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-400"
                }`}
              >
                {step.done ? step.icon : <Circle className="size-2.5" />}
              </div>
              {!isLast && (
                <div
                  className={`mt-0.5 w-0.5 flex-1 ${
                    step.done ? "bg-neutral-300" : "bg-neutral-100"
                  }`}
                  style={{ minHeight: "1.75rem" }}
                />
              )}
            </div>
            <div className="pb-5">
              <p
                className={`text-sm font-medium leading-none ${
                  (step as { cancelled?: boolean }).cancelled
                    ? "text-red-600"
                    : step.done
                    ? "text-neutral-900"
                    : "text-neutral-400"
                }`}
              >
                {step.label}
              </p>
              {step.timestamp && (
                <p className="mt-1 text-xs text-neutral-500">
                  {formatOrderDateTime(step.timestamp)}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderNumber = params.orderNumber as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Form state (controlled)
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("Pending")
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("Pending")
  const [courier, setCourier] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [notes, setNotes] = useState("")

  const loadOrder = useCallback(async () => {
    const supabase = createSupabaseBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace("/admin/login")
      return
    }

    // ── Admin identity check (second layer after middleware) ──────────────
    const verifyRes = await fetch("/api/admin/verify")
    if (!verifyRes.ok) {
      router.replace("/")
      return
    }

    const result = await fetchOrderByNumberAdmin(orderNumber)
    if (result) {
      setOrder(result)
      setOrderStatus(result.order_status)
      setPaymentStatus(result.payment_status)
      setCourier(result.courier ?? "")
      setTrackingNumber(result.tracking_number ?? "")
      setNotes(result.notes ?? "")
    }
    setLoading(false)
  }, [router, orderNumber])

  useEffect(() => {
    void loadOrder()
  }, [loadOrder])

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      const response = await fetch(`/api/orders/${orderNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_status: orderStatus,
          payment_status: paymentStatus,
          courier: courier.trim() || null,
          tracking_number: trackingNumber.trim() || null,
          notes: notes.trim() || null,
        }),
      })

      const data = (await response.json()) as {
        order?: Order
        error?: string
      }

      if (!response.ok || !data.order) {
        throw new Error(data.error ?? "Gagal menyimpan perubahan.")
      }

      setOrder(data.order)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Terjadi kesalahan.")
    } finally {
      setSaving(false)
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="border-b border-neutral-200 bg-white px-6 py-8">
          <div className="mx-auto max-w-7xl">
            <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
            <div className="mt-2 h-8 w-56 animate-pulse rounded bg-neutral-200" />
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <div className="h-48 animate-pulse rounded-2xl bg-neutral-200" />
              <div className="h-64 animate-pulse rounded-2xl bg-neutral-200" />
            </div>
            <div className="space-y-6">
              <div className="h-72 animate-pulse rounded-2xl bg-neutral-200" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!order) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 gap-4 text-center">
        <Package className="size-10 text-neutral-300" />
        <p className="text-sm text-neutral-500">Pesanan tidak ditemukan.</p>
        <Link
          href="/admin/orders"
          className="text-sm text-neutral-900 underline"
        >
          Kembali ke daftar pesanan
        </Link>
      </main>
    )
  }

  const inputCls =
    "h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400"
  const selectCls =
    "h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400 cursor-pointer"

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-8 sm:px-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-neutral-500">
              AEVA Admin — Pesanan
            </p>
            <h1 className="mt-2 font-heading text-2xl tracking-tight sm:text-3xl">
              {order.order_number}
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {formatOrderDate(order.created_at)} · {order.customer_name}
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="mt-3 text-[11px] tracking-[0.14em] uppercase text-neutral-500 underline-offset-4 hover:underline md:mt-0"
          >
            ← Semua Pesanan
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
          {/* ── Left Column ───────────────────────────────── */}
          <div className="space-y-6">
            {/* Current Status */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
              <h2 className="mb-4 text-sm font-semibold tracking-tight">
                Status Saat Ini
              </h2>
              <div className="flex flex-wrap gap-2">
                <StatusBadge
                  label={getOrderStatusLabel(order.order_status)}
                  colors={getOrderStatusColor(order.order_status)}
                />
                <StatusBadge
                  label={getPaymentStatusLabel(order.payment_status)}
                  colors={getPaymentStatusColor(order.payment_status)}
                />
              </div>
            </div>

            {/* Update Status Form */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
              <h2 className="mb-5 text-sm font-semibold tracking-tight">
                Update Status &amp; Pengiriman
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs tracking-[0.1em] uppercase text-neutral-500">
                    Status Pesanan
                  </span>
                  <select
                    value={orderStatus}
                    onChange={(e) =>
                      setOrderStatus(e.target.value as OrderStatus)
                    }
                    className={selectCls}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {getOrderStatusLabel(s)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs tracking-[0.1em] uppercase text-neutral-500">
                    Status Pembayaran
                  </span>
                  <select
                    value={paymentStatus}
                    onChange={(e) =>
                      setPaymentStatus(e.target.value as PaymentStatus)
                    }
                    className={selectCls}
                  >
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {getPaymentStatusLabel(s)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs tracking-[0.1em] uppercase text-neutral-500">
                    Kurir
                  </span>
                  <input
                    type="text"
                    placeholder="JNE, J&T, SiCepat..."
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    className={inputCls}
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs tracking-[0.1em] uppercase text-neutral-500">
                    Nomor Resi
                  </span>
                  <input
                    type="text"
                    placeholder="Nomor tracking..."
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className={inputCls}
                  />
                </label>

                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-xs tracking-[0.1em] uppercase text-neutral-500">
                    Catatan Internal Admin
                  </span>
                  <textarea
                    rows={3}
                    placeholder="Catatan internal (tidak dilihat pelanggan)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400"
                  />
                </label>
              </div>

              {saveError && (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-700">{saveError}</p>
                </div>
              )}

              {saveSuccess && (
                <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-sm text-emerald-700">
                    ✓ Perubahan berhasil disimpan
                  </p>
                </div>
              )}

              <Button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-900 px-6 text-[11px] tracking-[0.1em] uppercase text-white transition hover:bg-neutral-800 disabled:opacity-60"
              >
                <Save className="size-3.5" />
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>

            {/* Products */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
              <h2 className="mb-4 text-sm font-semibold tracking-tight">
                Produk Dipesan
              </h2>
              <div className="divide-y divide-neutral-100">
                {order.order_items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    {item.product_image ? (
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#ebe6dc]">
                        <Image
                          src={item.product_image}
                          alt={item.product_name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                        <Package className="size-5 text-neutral-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-snug">
                        {item.product_name}
                      </p>
                      {(item.selected_color || item.selected_size) && (
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {[item.selected_color, item.selected_size]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-neutral-500">
                        {formatPrice(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4 text-sm">
                <div className="flex justify-between text-neutral-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Ongkir</span>
                  <span>{formatPrice(order.shipping_fee)}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-100 pt-2 font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Column ──────────────────────────────── */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
              <h2 className="mb-3 text-sm font-semibold tracking-tight">
                Informasi Pelanggan
              </h2>
              <div className="divide-y divide-neutral-50">
                <InfoRow label="Nama" value={order.customer_name} />
                <InfoRow label="Email" value={order.customer_email} />
              </div>
            </div>

            {/* Shipping Address */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
              <h2 className="mb-3 text-sm font-semibold tracking-tight">
                Alamat Pengiriman
              </h2>
              <div className="space-y-1 text-sm text-neutral-700">
                <p className="font-medium">{order.shipping_name}</p>
                <p className="text-neutral-500">{order.shipping_phone}</p>
                <p>{order.shipping_address}</p>
                <p>
                  {order.shipping_city}, {order.shipping_province}{" "}
                  {order.shipping_postal_code}
                </p>
                <p>Indonesia</p>
              </div>
              {/* Biteship service info */}
              {order.shipping_service && (
                <div className="mt-3 border-t border-neutral-100 pt-3">
                  <p className="text-xs tracking-[0.08em] uppercase text-neutral-500">
                    Layanan Pengiriman
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {order.courier} — {order.shipping_service}
                  </p>
                </div>
              )}
            </div>

            {/* Customer Note */}
            {order.customer_note && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 sm:p-6">
                <h2 className="mb-2 text-sm font-semibold tracking-tight text-amber-800">
                  Catatan Pelanggan
                </h2>
                <p className="text-sm text-amber-700 leading-relaxed">
                  {order.customer_note}
                </p>
              </div>
            )}

            {/* Timeline */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
              <h2 className="mb-5 text-sm font-semibold tracking-tight">
                Timeline
              </h2>
              <OrderTimeline order={order} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 border-b border-neutral-50 last:border-0">
      <span className="text-xs tracking-[0.08em] uppercase text-neutral-500 shrink-0">
        {label}
      </span>
      <span className="text-sm text-right text-neutral-800 break-all">
        {value}
      </span>
    </div>
  )
}
