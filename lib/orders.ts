// ─── Order Status Enums ───────────────────────────────────────────────────────

export type OrderStatus =
  | "Pending"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled"

export type PaymentStatus = "Pending" | "Paid" | "Failed" | "Refunded"

export const ORDER_STATUSES: OrderStatus[] = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
]

export const PAYMENT_STATUSES: PaymentStatus[] = [
  "Pending",
  "Paid",
  "Failed",
  "Refunded",
]

// ─── Core Types ───────────────────────────────────────────────────────────────

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  product_name: string
  product_image: string
  selected_size: string | null
  selected_color: string | null
  quantity: number
  price: number
}

export type Order = {
  // Identity
  id: string
  order_number: string
  user_id: string

  // Customer Info
  customer_name: string
  customer_email: string
  customer_note: string | null

  // Totals
  subtotal: number
  shipping_fee: number
  total: number

  // Status
  payment_status: PaymentStatus
  order_status: OrderStatus

  // Shipping Address
  shipping_name: string
  shipping_phone: string
  shipping_address: string
  shipping_city: string
  shipping_province: string
  shipping_postal_code: string

  // Fulfillment
  courier: string | null           // Nama kurir, e.g. "JNE"
  courier_code: string | null      // Kode kurir dari Biteship, e.g. "jne"
  shipping_service: string | null  // Nama layanan, e.g. "REG", "YES"
  tracking_number: string | null

  // Biteship Area IDs (untuk future auto-shipment creation)
  origin_area_id: string | null
  destination_area_id: string | null

  // Midtrans Readiness
  midtrans_transaction_id: string | null
  midtrans_payment_type: string | null
  midtrans_metadata: Record<string, unknown> | null

  // Admin Notes
  notes: string | null

  // Timeline
  paid_at: string | null
  processing_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  cancelled_at: string | null

  // Audit
  created_at: string
  updated_at: string

  // Joined
  order_items?: OrderItem[]
}

// ─── Create Order Payload ─────────────────────────────────────────────────────

export type CreateOrderPayload = {
  user_id: string
  customer_name: string
  customer_email: string
  customer_note?: string | null
  subtotal: number
  shipping_fee: number
  total: number
  shipping_name: string
  shipping_phone: string
  shipping_address: string
  shipping_city: string
  shipping_province: string
  shipping_postal_code: string
  // Biteship shipping info
  courier?: string | null
  courier_code?: string | null
  shipping_service?: string | null
  destination_area_id?: string | null
  items: {
    product_id: string
    product_name: string
    product_image: string
    selected_size?: string | null
    selected_color?: string | null
    quantity: number
    price: number
  }[]
}

// ─── Update Status Payload ────────────────────────────────────────────────────

export type UpdateOrderStatusPayload = {
  order_status?: OrderStatus
  payment_status?: PaymentStatus
  courier?: string | null
  tracking_number?: string | null
  notes?: string | null
}

// ─── Status Color Helpers ─────────────────────────────────────────────────────

export function getOrderStatusColor(status: OrderStatus): {
  bg: string
  text: string
  dot: string
} {
  switch (status) {
    case "Pending":
      return { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" }
    case "Processing":
      return { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" }
    case "Shipped":
      return { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-400" }
    case "Delivered":
      return { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" }
    case "Cancelled":
      return { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" }
    default:
      return { bg: "bg-neutral-100", text: "text-neutral-600", dot: "bg-neutral-400" }
  }
}

export function getPaymentStatusColor(status: PaymentStatus): {
  bg: string
  text: string
  dot: string
} {
  switch (status) {
    case "Pending":
      return { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" }
    case "Paid":
      return { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" }
    case "Failed":
      return { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" }
    case "Refunded":
      return { bg: "bg-neutral-100", text: "text-neutral-600", dot: "bg-neutral-400" }
    default:
      return { bg: "bg-neutral-100", text: "text-neutral-600", dot: "bg-neutral-400" }
  }
}

// ─── Label Helpers ────────────────────────────────────────────────────────────

export function getOrderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    Pending: "Menunggu",
    Processing: "Diproses",
    Shipped: "Dikirim",
    Delivered: "Diterima",
    Cancelled: "Dibatalkan",
  }
  return labels[status] ?? status
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    Pending: "Belum Bayar",
    Paid: "Lunas",
    Failed: "Gagal",
    Refunded: "Dikembalikan",
  }
  return labels[status] ?? status
}

// ─── Order Number Generation ──────────────────────────────────────────────────

/**
 * Generates a human-friendly order number.
 * Example: AEVA-20260617-0001
 * The sequence is provided by the caller (from a DB count query).
 */
export function generateOrderNumber(sequence: number): string {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  const seq = String(sequence).padStart(4, "0")
  return `AEVA-${y}${m}${d}-${seq}`
}

// ─── Format Helpers ───────────────────────────────────────────────────────────

export function formatOrderDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatOrderDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
