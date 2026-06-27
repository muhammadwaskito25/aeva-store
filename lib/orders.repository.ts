/**
 * orders.repository.ts
 *
 * All Supabase queries for the orders system.
 *
 * INSERT and admin UPDATE operations use the Supabase Service Role Key
 * (bypasses RLS) — called only from server-side API Routes.
 *
 * Customer SELECT operations use the regular server client (respects RLS,
 * so customers can only see their own orders).
 *
 * Admin is identified by: process.env.ADMIN_EMAIL
 */

import { createClient } from "@supabase/supabase-js"

import type {
  CreateOrderPayload,
  Order,
  OrderItem,
  UpdateOrderStatusPayload,
} from "@/lib/orders"
import { generateOrderNumber } from "@/lib/orders"

// ─── Service Role Client (server-only, bypasses RLS) ─────────────────────────

function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env variables."
    )
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ─── Map DB row → Order ───────────────────────────────────────────────────────

function mapOrderRow(row: Record<string, unknown>): Order {
  return {
    id: String(row.id ?? ""),
    order_number: String(row.order_number ?? ""),
    user_id: String(row.user_id ?? ""),
    customer_name: String(row.customer_name ?? ""),
    customer_email: String(row.customer_email ?? ""),
    customer_note: (row.customer_note as string | null) ?? null,
    subtotal: Number(row.subtotal ?? 0),
    shipping_fee: Number(row.shipping_fee ?? 0),
    total: Number(row.total ?? 0),
    payment_status: (row.payment_status as Order["payment_status"]) ?? "Pending",
    order_status: (row.order_status as Order["order_status"]) ?? "Pending",
    shipping_name: String(row.shipping_name ?? ""),
    shipping_phone: String(row.shipping_phone ?? ""),
    shipping_address: String(row.shipping_address ?? ""),
    shipping_city: String(row.shipping_city ?? ""),
    shipping_province: String(row.shipping_province ?? ""),
    shipping_postal_code: String(row.shipping_postal_code ?? ""),
    courier: (row.courier as string | null) ?? null,
    courier_code: (row.courier_code as string | null) ?? null,
    shipping_service: (row.shipping_service as string | null) ?? null,
    tracking_number: (row.tracking_number as string | null) ?? null,
    origin_area_id: (row.origin_area_id as string | null) ?? null,
    destination_area_id: (row.destination_area_id as string | null) ?? null,
    midtrans_transaction_id: (row.midtrans_transaction_id as string | null) ?? null,
    midtrans_payment_type: (row.midtrans_payment_type as string | null) ?? null,
    midtrans_metadata: (row.midtrans_metadata as Record<string, unknown> | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    paid_at: (row.paid_at as string | null) ?? null,
    processing_at: (row.processing_at as string | null) ?? null,
    shipped_at: (row.shipped_at as string | null) ?? null,
    delivered_at: (row.delivered_at as string | null) ?? null,
    cancelled_at: (row.cancelled_at as string | null) ?? null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
    order_items: Array.isArray(row.order_items)
      ? (row.order_items as Record<string, unknown>[]).map(mapItemRow)
      : undefined,
  }
}

function mapItemRow(row: Record<string, unknown>): OrderItem {
  return {
    id: String(row.id ?? ""),
    order_id: String(row.order_id ?? ""),
    product_id: String(row.product_id ?? ""),
    product_name: String(row.product_name ?? ""),
    product_image: String(row.product_image ?? ""),
    selected_size: (row.selected_size as string | null) ?? null,
    selected_color: (row.selected_color as string | null) ?? null,
    quantity: Number(row.quantity ?? 1),
    price: Number(row.price ?? 0),
  }
}

// ─── ORDER NUMBER GENERATION ──────────────────────────────────────────────────

/** Generate a unique AEVA-YYYYMMDD-XXXX order number. */
async function generateUniqueOrderNumber(): Promise<string> {
  const supabase = createServiceRoleClient()

  // Count orders created today to generate daily sequence
  const today = new Date().toISOString().slice(0, 10) // "2026-06-17"
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .gte("created_at", `${today}T00:00:00.000Z`)
    .lt("created_at", `${today}T23:59:59.999Z`)

  const sequence = (count ?? 0) + 1
  return generateOrderNumber(sequence)
}

// ─── CREATE ORDER ─────────────────────────────────────────────────────────────

/**
 * Creates a new order with status Pending/Pending.
 * Uses Service Role Key to bypass RLS.
 * Returns the created order_number.
 */
export async function createOrder(
  payload: CreateOrderPayload
): Promise<{ order_number: string; order_id: string }> {
  const supabase = createServiceRoleClient()

  const order_number = await generateUniqueOrderNumber()

  // Insert order
  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number,
      user_id: payload.user_id,
      customer_name: payload.customer_name,
      customer_email: payload.customer_email,
      customer_note: payload.customer_note ?? null,
      subtotal: payload.subtotal,
      shipping_fee: payload.shipping_fee,
      total: payload.total,
      payment_status: "Pending",
      order_status: "Pending",
      shipping_name: payload.shipping_name,
      shipping_phone: payload.shipping_phone,
      shipping_address: payload.shipping_address,
      shipping_city: payload.shipping_city,
      shipping_province: payload.shipping_province,
      shipping_postal_code: payload.shipping_postal_code,
      // Biteship fields
      courier: payload.courier ?? null,
      courier_code: payload.courier_code ?? null,
      shipping_service: payload.shipping_service ?? null,
      origin_area_id: process.env.BITESHIP_ORIGIN_AREA_ID ?? null,
      destination_area_id: payload.destination_area_id ?? null,
    })
    .select("id, order_number")
    .single()

  if (orderError || !orderData) {
    throw new Error(orderError?.message ?? "Failed to create order")
  }

  const order_id = String((orderData as Record<string, unknown>).id)

  // Insert order items
  if (payload.items.length > 0) {
    const { error: itemsError } = await supabase.from("order_items").insert(
      payload.items.map((item) => ({
        order_id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_image: item.product_image,
        selected_size: item.selected_size ?? null,
        selected_color: item.selected_color ?? null,
        quantity: item.quantity,
        price: item.price,
      }))
    )

    if (itemsError) {
      // Rollback: delete the order if items failed
      await supabase.from("orders").delete().eq("id", order_id)
      throw new Error(itemsError.message ?? "Failed to create order items")
    }
  }

  return {
    order_number: String((orderData as Record<string, unknown>).order_number),
    order_id,
  }
}

// ─── CUSTOMER QUERIES ─────────────────────────────────────────────────────────

/**
 * Fetch all orders for a specific customer.
 * Uses Service Role client (customer auth is already verified upstream by middleware).
 */
export async function fetchOrdersByUser(userId: string): Promise<Order[]> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[orders] fetchOrdersByUser:", error.message)
    return []
  }

  return ((data ?? []) as Record<string, unknown>[]).map(mapOrderRow)
}

/**
 * Fetch a single order by order_number.
 * Verifies ownership via user_id.
 */
export async function fetchOrderByNumber(
  orderNumber: string,
  userId: string
): Promise<Order | null> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("order_number", orderNumber)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    console.error("[orders] fetchOrderByNumber:", error.message)
    return null
  }

  if (!data) return null
  return mapOrderRow(data as Record<string, unknown>)
}

// ─── ADMIN QUERIES ────────────────────────────────────────────────────────────

/**
 * Fetch all orders (admin only).
 * Caller must verify admin identity before calling.
 */
export async function fetchAllOrders(): Promise<Order[]> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[orders] fetchAllOrders:", error.message)
    return []
  }

  return ((data ?? []) as Record<string, unknown>[]).map(mapOrderRow)
}

/**
 * Fetch a single order by order_number (admin — no user_id restriction).
 */
export async function fetchOrderByNumberAdmin(
  orderNumber: string
): Promise<Order | null> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("order_number", orderNumber)
    .maybeSingle()

  if (error) {
    console.error("[orders] fetchOrderByNumberAdmin:", error.message)
    return null
  }

  if (!data) return null
  return mapOrderRow(data as Record<string, unknown>)
}

/**
 * Update order status, fulfillment, and/or admin notes.
 * Automatically sets timeline timestamps.
 * Caller must verify admin identity before calling.
 */
export async function updateOrderStatus(
  orderNumber: string,
  payload: UpdateOrderStatusPayload
): Promise<Order | null> {
  const supabase = createServiceRoleClient()

  // Build timeline timestamps
  const timelineUpdates: Record<string, string | null> = {}
  if (payload.order_status === "Processing") {
    timelineUpdates.processing_at = new Date().toISOString()
  }
  if (payload.order_status === "Shipped") {
    timelineUpdates.shipped_at = new Date().toISOString()
  }
  if (payload.order_status === "Delivered") {
    timelineUpdates.delivered_at = new Date().toISOString()
  }
  if (payload.order_status === "Cancelled") {
    timelineUpdates.cancelled_at = new Date().toISOString()
  }
  if (payload.payment_status === "Paid") {
    timelineUpdates.paid_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from("orders")
    .update({
      ...(payload.order_status !== undefined && {
        order_status: payload.order_status,
      }),
      ...(payload.payment_status !== undefined && {
        payment_status: payload.payment_status,
      }),
      ...(payload.courier !== undefined && { courier: payload.courier }),
      ...(payload.tracking_number !== undefined && {
        tracking_number: payload.tracking_number,
      }),
      ...(payload.notes !== undefined && { notes: payload.notes }),
      ...timelineUpdates,
    })
    .eq("order_number", orderNumber)
    .select("*, order_items(*)")
    .single()

  if (error) {
    console.error("[orders] updateOrderStatus:", error.message)
    return null
  }

  return mapOrderRow(data as Record<string, unknown>)
}

/**
 * Update order Midtrans data from webhook notifications.
 */
export async function updateOrderMidtransData(
  orderNumber: string,
  payload: {
    payment_status: import("@/lib/orders").PaymentStatus
    midtrans_transaction_id?: string
    midtrans_payment_type?: string
    midtrans_metadata?: Record<string, unknown>
  }
): Promise<Order | null> {
  const supabase = createServiceRoleClient()

  const timelineUpdates: Record<string, string | null> = {}
  if (payload.payment_status === "Paid") {
    timelineUpdates.paid_at = new Date().toISOString()
  } else if (payload.payment_status === "Pending") {
    timelineUpdates.paid_at = null
  }

  const { data, error } = await supabase
    .from("orders")
    .update({
      payment_status: payload.payment_status,
      ...(payload.midtrans_transaction_id && {
        midtrans_transaction_id: payload.midtrans_transaction_id,
      }),
      ...(payload.midtrans_payment_type && {
        midtrans_payment_type: payload.midtrans_payment_type,
      }),
      ...(payload.midtrans_metadata && {
        midtrans_metadata: payload.midtrans_metadata,
      }),
      ...timelineUpdates,
    })
    .eq("order_number", orderNumber)
    .select("*, order_items(*)")
    .single()

  if (error) {
    console.error("[orders] updateOrderMidtransData:", error.message)
    return null
  }

  return mapOrderRow(data as Record<string, unknown>)
}
