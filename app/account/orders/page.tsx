"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ChevronRight, Package, ShoppingBag } from "lucide-react"

import { Navbar } from "@/components/Navbar"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  formatOrderDate,
  getOrderStatusColor,
  getOrderStatusLabel,
  getPaymentStatusColor,
  getPaymentStatusLabel,
} from "@/lib/orders"
import { formatPrice as formatIDR } from "@/lib/products"
import type { Order } from "@/lib/orders"

function StatusBadge({
  label,
  colors,
}: {
  label: string
  colors: { bg: string; text: string; dot: string }
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.08em] uppercase ${colors.bg} ${colors.text}`}
    >
      <span className={`size-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  )
}

export default function AccountOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

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

      const res = await fetch("/api/account/orders")
      if (!res.ok) throw new Error("Gagal memuat pesanan")
      const userOrders = await res.json()
      setOrders(userOrders)
      setLoading(false)
    }
    void load()
  }, [router])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f5ef]">
        <Navbar />
        <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="mb-10 flex flex-col gap-1">
            <p className="text-[11px] tracking-[0.22em] uppercase text-neutral-500">
              Akun Saya
            </p>
            <div className="mt-2 h-8 w-48 animate-pulse rounded-lg bg-neutral-200" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 w-full animate-pulse rounded-2xl bg-neutral-200"
              />
            ))}
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f8f5ef] text-neutral-900">
      <Navbar />

      <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-10 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] tracking-[0.22em] uppercase text-neutral-500">
              Akun Saya
            </p>
            <h1 className="mt-2 font-heading text-3xl tracking-tight sm:text-4xl">
              Riwayat Pesanan
            </h1>
            <p className="mt-1.5 text-sm text-neutral-500">
              {orders.length > 0
                ? `${orders.length} pesanan ditemukan`
                : "Belum ada pesanan"}
            </p>
          </div>
          <Link
            href="/account"
            className="mt-4 text-[11px] tracking-[0.14em] uppercase text-neutral-500 underline-offset-4 hover:underline sm:mt-0"
          >
            ← Kembali ke Akun
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
              <ShoppingBag className="size-7 text-neutral-400" />
            </div>
            <h2 className="font-heading text-xl tracking-tight">
              Belum ada pesanan
            </h2>
            <p className="mt-2 max-w-xs text-sm text-neutral-500">
              Mulai belanja koleksi scarf terbaru AÉVA dan pesananmu akan muncul di sini.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex h-10 items-center rounded-xl bg-neutral-900 px-6 text-[11px] tracking-[0.14em] uppercase text-white transition hover:bg-neutral-800"
            >
              Belanja Sekarang
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const orderStatusColors = getOrderStatusColor(order.order_status)
              const paymentStatusColors = getPaymentStatusColor(order.payment_status)
              const firstItem = order.order_items?.[0]
              const itemCount = order.order_items?.reduce((t, i) => t + i.quantity, 0) ?? 0

              return (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.order_number}`}
                  className="group block rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_8px_30px_-18px_rgba(0,0,0,0.1)] transition hover:border-neutral-300 hover:shadow-[0_12px_40px_-18px_rgba(0,0,0,0.18)] sm:p-6"
                >
                  <div className="flex items-start gap-4">
                    {firstItem?.product_image ? (
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#ebe6dc]">
                        <Image src={firstItem.product_image} alt={firstItem.product_name} fill sizes="64px" className="object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                        <Package className="size-6 text-neutral-400" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium tracking-tight">{order.order_number}</p>
                          <p className="mt-0.5 text-xs text-neutral-500">
                            {formatOrderDate(order.created_at)} · {itemCount} item
                          </p>
                        </div>
                        <ChevronRight className="size-4 text-neutral-400 transition group-hover:text-neutral-700 shrink-0" />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <StatusBadge label={getOrderStatusLabel(order.order_status)} colors={orderStatusColors} />
                        <StatusBadge label={getPaymentStatusLabel(order.payment_status)} colors={paymentStatusColors} />
                      </div>

                      <p className="mt-3 text-sm font-medium">{formatIDR(order.total)}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}