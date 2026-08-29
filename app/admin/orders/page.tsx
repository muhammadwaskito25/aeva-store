"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ChevronRight,
  Package,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react"

import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  formatOrderDate,
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
  small,
}: {
  label: string
  colors: { bg: string; text: string; dot: string }
  small?: boolean
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium tracking-[0.08em] uppercase ${small ? "text-[10px]" : "text-[11px]"} ${colors.bg} ${colors.text}`}
    >
      <span className={`size-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(false)

  // Filters
  const [search, setSearch] = useState("")
  const [filterOrderStatus, setFilterOrderStatus] = useState<OrderStatus | "all">("all")
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<PaymentStatus | "all">("all")

  // Load orders
  const loadOrders = useCallback(async () => {
    const supabase = createSupabaseBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace("/admin/login")
      return
    }

    const verifyRes = await fetch("/api/admin/verify")
    if (!verifyRes.ok) {
      setAuthError(true)
      return
    }

    // ✅ Panggil via API route, bukan langsung (agar service role key aman di server)
    const ordersRes = await fetch("/api/admin/orders")
    if (!ordersRes.ok) throw new Error("Gagal memuat pesanan")
    const allOrders = await ordersRes.json()
    setOrders(allOrders)
    setLoading(false)
  }, [router])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  // Filtered & searched orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        search === "" ||
        order.order_number.toLowerCase().includes(search.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        order.customer_email.toLowerCase().includes(search.toLowerCase())

      const matchesOrderStatus =
        filterOrderStatus === "all" || order.order_status === filterOrderStatus

      const matchesPaymentStatus =
        filterPaymentStatus === "all" || order.payment_status === filterPaymentStatus

      return matchesSearch && matchesOrderStatus && matchesPaymentStatus
    })
  }, [orders, search, filterOrderStatus, filterPaymentStatus])

  function clearFilters() {
    setSearch("")
    setFilterOrderStatus("all")
    setFilterPaymentStatus("all")
  }

  const hasActiveFilters =
    search !== "" || filterOrderStatus !== "all" || filterPaymentStatus !== "all"

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="border-b border-neutral-200 bg-white px-6 py-8">
          <div className="mx-auto max-w-7xl">
            <div className="h-5 w-24 animate-pulse rounded bg-neutral-200" />
            <div className="mt-2 h-8 w-48 animate-pulse rounded bg-neutral-200" />
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6 py-8 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 w-full animate-pulse rounded-xl bg-neutral-200" />
          ))}
        </div>
      </main>
    )
  }

  if (authError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 text-sm text-neutral-500">
        Akses ditolak.
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
              Manajemen Pesanan
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {orders.length} total pesanan
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/admin"
              className="inline-flex h-10 items-center rounded-xl border border-neutral-200 px-4 text-[11px] tracking-[0.14em] uppercase text-neutral-700 transition hover:border-neutral-400"
            >
              Produk
            </a>
            <a
              href="/admin/settings"
              className="inline-flex h-10 items-center rounded-xl border border-neutral-200 px-4 text-[11px] tracking-[0.14em] uppercase text-neutral-700 transition hover:border-neutral-400"
            >
              Pengaturan Utama
            </a>
            <a
              href="/admin/about"
              className="inline-flex h-10 items-center rounded-xl border border-neutral-200 px-4 text-[11px] tracking-[0.14em] uppercase text-neutral-700 transition hover:border-neutral-400"
            >
              Halaman About
            </a>
            <a
              href="/admin/orders"
              className="inline-flex h-10 items-center rounded-xl border border-neutral-900 bg-neutral-900 px-4 text-[11px] tracking-[0.14em] uppercase text-white transition"
            >
              Pesanan
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari nomor pesanan, nama, atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-neutral-400 shrink-0" />
            <select
              value={filterOrderStatus}
              onChange={(e) => setFilterOrderStatus(e.target.value as OrderStatus | "all")}
              className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400"
            >
              <option value="all">Status Order: Semua</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{getOrderStatusLabel(s)}</option>
              ))}
            </select>

            <select
              value={filterPaymentStatus}
              onChange={(e) => setFilterPaymentStatus(e.target.value as PaymentStatus | "all")}
              className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400"
            >
              <option value="all">Pembayaran: Semua</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>{getPaymentStatusLabel(s)}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex h-10 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-600 transition hover:border-neutral-400"
              >
                <X className="size-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <p className="mb-4 text-sm text-neutral-500">
            Menampilkan {filteredOrders.length} dari {orders.length} pesanan
          </p>
        )}

        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white py-20 text-center">
            <Package className="mb-4 size-8 text-neutral-300" />
            <p className="text-sm text-neutral-500">
              {hasActiveFilters ? "Tidak ada pesanan yang sesuai filter." : "Belum ada pesanan masuk."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            <div className="hidden border-b border-neutral-100 bg-neutral-50 px-6 py-3 sm:grid sm:grid-cols-[1fr_160px_160px_120px_48px]">
              <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-neutral-500">Pesanan</p>
              <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-neutral-500">Status Order</p>
              <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-neutral-500">Pembayaran</p>
              <p className="text-right text-[11px] font-medium tracking-[0.1em] uppercase text-neutral-500">Total</p>
              <div />
            </div>

            <div className="divide-y divide-neutral-100">
              {filteredOrders.map((order) => {
                const firstItem = order.order_items?.[0]
                const itemCount = order.order_items?.reduce((t, i) => t + i.quantity, 0) ?? 0

                return (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.order_number}`}
                    className="group flex items-center gap-4 px-5 py-4 transition hover:bg-neutral-50 sm:grid sm:grid-cols-[1fr_160px_160px_120px_48px] sm:px-6"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {firstItem?.product_image ? (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#ebe6dc]">
                          <Image src={firstItem.product_image} alt={firstItem.product_name} fill sizes="40px" className="object-cover" />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                          <Package className="size-4 text-neutral-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium text-sm">{order.order_number}</p>
                        <p className="truncate text-xs text-neutral-500">
                          {order.customer_name} · {formatOrderDate(order.created_at)}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-400 sm:hidden">{itemCount} item</p>
                      </div>
                    </div>

                    <div className="hidden sm:block">
                      <StatusBadge label={getOrderStatusLabel(order.order_status)} colors={getOrderStatusColor(order.order_status)} small />
                    </div>

                    <div className="hidden sm:block">
                      <StatusBadge label={getPaymentStatusLabel(order.payment_status)} colors={getPaymentStatusColor(order.payment_status)} small />
                    </div>

                    <p className="hidden text-right text-sm font-medium sm:block">{formatPrice(order.total)}</p>

                    <ChevronRight className="ml-auto size-4 text-neutral-300 transition group-hover:text-neutral-600 shrink-0" />
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}