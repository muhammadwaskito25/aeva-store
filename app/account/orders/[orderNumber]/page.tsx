"use client"

import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { CheckCircle2, Circle, Clock, Package, Truck, XCircle } from "lucide-react"

import { Navbar } from "@/components/Navbar"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { fetchOrderByNumber } from "@/lib/orders.repository"
import {
  formatOrderDateTime,
  formatOrderDate,
  getOrderStatusColor,
  getOrderStatusLabel,
  getPaymentStatusColor,
  getPaymentStatusLabel,
} from "@/lib/orders"
import { formatPrice } from "@/lib/products"
import type { Order } from "@/lib/orders"

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

type TimelineStep = {
  label: string
  timestamp: string | null
  icon: React.ReactNode
  done: boolean
  cancelled?: boolean
}

function OrderTimeline({ order }: { order: Order }) {
  const isCancelled = order.order_status === "Cancelled"

  const steps: TimelineStep[] = [
    {
      label: "Pesanan Dibuat",
      timestamp: order.created_at,
      icon: <Package className="size-4" />,
      done: true,
    },
    {
      label: "Pembayaran Lunas",
      timestamp: order.paid_at,
      icon: <CheckCircle2 className="size-4" />,
      done: order.payment_status === "Paid",
    },
    {
      label: "Sedang Diproses",
      timestamp: order.processing_at,
      icon: <Clock className="size-4" />,
      done: !!order.processing_at,
    },
    {
      label: "Dikirim",
      timestamp: order.shipped_at,
      icon: <Truck className="size-4" />,
      done: !!order.shipped_at,
    },
    {
      label: "Diterima",
      timestamp: order.delivered_at,
      icon: <CheckCircle2 className="size-4" />,
      done: !!order.delivered_at,
    },
  ]

  if (isCancelled) {
    steps.push({
      label: "Dibatalkan",
      timestamp: order.cancelled_at,
      icon: <XCircle className="size-4" />,
      done: true,
      cancelled: true,
    })
  }

  return (
    <div className="relative space-y-0">
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1
        return (
          <div key={step.label} className="flex gap-3">
            {/* Line + Icon column */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition ${
                  step.cancelled
                    ? "border-red-300 bg-red-50 text-red-500"
                    : step.done
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-400"
                }`}
              >
                {step.done ? step.icon : <Circle className="size-3" />}
              </div>
              {!isLast && (
                <div
                  className={`mt-0.5 w-0.5 flex-1 ${
                    step.done ? "bg-neutral-900/20" : "bg-neutral-200"
                  }`}
                  style={{ minHeight: "2rem" }}
                />
              )}
            </div>
            {/* Content */}
            <div className="pb-6">
              <p
                className={`text-sm font-medium ${
                  step.cancelled
                    ? "text-red-600"
                    : step.done
                    ? "text-neutral-900"
                    : "text-neutral-400"
                }`}
              >
                {step.label}
              </p>
              {step.timestamp && (
                <p className="mt-0.5 text-xs text-neutral-500">
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

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderNumber = params.orderNumber as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace("/login?next=/account/orders")
        return
      }

      const result = await fetchOrderByNumber(orderNumber, user.id)
      if (!result) {
        setNotFound(true)
      } else {
        setOrder(result)
      }
      setLoading(false)
    }
    void load()
  }, [router, orderNumber])

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f5ef]">
        <Navbar />
        <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="space-y-4">
            <div className="h-8 w-56 animate-pulse rounded-lg bg-neutral-200" />
            <div className="h-64 w-full animate-pulse rounded-2xl bg-neutral-200" />
            <div className="h-48 w-full animate-pulse rounded-2xl bg-neutral-200" />
          </div>
        </section>
      </main>
    )
  }

  // ── Not Found ──────────────────────────────────────────────────────────────

  if (notFound || !order) {
    return (
      <main className="min-h-screen bg-[#f8f5ef] text-neutral-900">
        <Navbar />
        <section className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center px-4 py-32 text-center sm:px-6">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
            <Package className="size-7 text-neutral-400" />
          </div>
          <h1 className="font-heading text-2xl tracking-tight">
            Pesanan tidak ditemukan
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Pesanan ini tidak ada atau bukan milik akun kamu.
          </p>
          <Link
            href="/account/orders"
            className="mt-6 inline-flex h-10 items-center rounded-xl bg-neutral-900 px-6 text-[11px] tracking-[0.14em] uppercase text-white transition hover:bg-neutral-800"
          >
            Kembali ke Pesanan
          </Link>
        </section>
      </main>
    )
  }

  const orderStatusColors = getOrderStatusColor(order.order_status)
  const paymentStatusColors = getPaymentStatusColor(order.payment_status)

  return (
    <main className="min-h-screen bg-[#f8f5ef] text-neutral-900">
      <Navbar />

      <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] tracking-[0.22em] uppercase text-neutral-500">
              Detail Pesanan
            </p>
            <h1 className="mt-2 font-heading text-2xl tracking-tight sm:text-3xl">
              {order.order_number}
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Dibuat pada {formatOrderDate(order.created_at)}
            </p>
          </div>
          <Link
            href="/account/orders"
            className="mt-4 text-[11px] tracking-[0.14em] uppercase text-neutral-500 underline-offset-4 hover:underline sm:mt-0"
          >
            ← Semua Pesanan
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
              <h2 className="mb-4 text-sm font-semibold tracking-tight text-neutral-900">
                Status Pesanan
              </h2>
              <div className="flex flex-wrap gap-2">
                <StatusBadge
                  label={getOrderStatusLabel(order.order_status)}
                  colors={orderStatusColors}
                />
                <StatusBadge
                  label={getPaymentStatusLabel(order.payment_status)}
                  colors={paymentStatusColors}
                />
              </div>

              {/* Shipping Info from Biteship */}
              {(order.courier || order.tracking_number) && (
                <div className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                  <p className="text-xs tracking-[0.1em] uppercase text-neutral-500">
                    Informasi Pengiriman
                  </p>
                  {order.courier && (
                    <p className="mt-1 text-sm font-medium">
                      Kurir: {order.courier}
                      {order.shipping_service && (
                        <span className="ml-1.5 font-normal text-neutral-500">
                          — {order.shipping_service}
                        </span>
                      )}
                    </p>
                  )}
                  {order.tracking_number && (
                    <p className="mt-1 text-sm">
                      No. Resi:{" "}
                      <span className="font-mono font-medium">
                        {order.tracking_number}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Products */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
              <h2 className="mb-4 text-sm font-semibold tracking-tight text-neutral-900">
                Produk Dipesan
              </h2>
              <div className="divide-y divide-neutral-100">
                {order.order_items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    {item.product_image ? (
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#ebe6dc]">
                        <Image
                          src={item.product_image}
                          alt={item.product_name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                        <Package className="size-5 text-neutral-400" />
                      </div>
                    )}

                    <div className="flex-1">
                      <p className="font-medium leading-snug">
                        {item.product_name}
                      </p>
                      {(item.selected_color || item.selected_size) && (
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {[item.selected_color, item.selected_size]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-neutral-500">
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
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Ongkir</span>
                  <span>{formatPrice(order.shipping_fee)}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-100 pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Customer Note */}
            {order.customer_note && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
                <h2 className="mb-2 text-sm font-semibold tracking-tight">
                  Catatan Pesanan
                </h2>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {order.customer_note}
                </p>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Timeline */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
              <h2 className="mb-5 text-sm font-semibold tracking-tight text-neutral-900">
                Timeline
              </h2>
              <OrderTimeline order={order} />
            </div>

            {/* Shipping Address */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
              <h2 className="mb-3 text-sm font-semibold tracking-tight text-neutral-900">
                Alamat Pengiriman
              </h2>
              <div className="space-y-1 text-sm text-neutral-700">
                <p className="font-medium">{order.shipping_name}</p>
                <p>{order.shipping_phone}</p>
                <p>{order.shipping_address}</p>
                <p>
                  {order.shipping_city}, {order.shipping_province}{" "}
                  {order.shipping_postal_code}
                </p>
                <p>Indonesia</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
