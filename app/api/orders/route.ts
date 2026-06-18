/**
 * POST /api/orders
 *
 * Creates a new order from checkout form data.
 * Requires authentication — user must be logged in.
 * Defaults: payment_status = 'Pending', order_status = 'Pending'
 *
 * Body: CreateOrderPayload (without user_id — inferred from session)
 * Returns: { order_number: string }
 */

import { NextRequest, NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createOrder } from "@/lib/orders.repository"
import type { CreateOrderPayload } from "@/lib/orders"

export async function POST(request: NextRequest) {
  try {
    // ── 1. Verify authentication ────────────────────────────────────────────
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login untuk membuat pesanan." },
        { status: 401 }
      )
    }

    // ── 2. Parse & validate request body ───────────────────────────────────
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: "Request body tidak valid." },
        { status: 400 }
      )
    }

    const data = body as Record<string, unknown>

    // Required fields validation
    const requiredFields = [
      "customer_name",
      "customer_email",
      "subtotal",
      "shipping_fee",
      "total",
      "shipping_name",
      "shipping_phone",
      "shipping_address",
      "shipping_city",
      "shipping_province",
      "shipping_postal_code",
      "items",
    ]

    for (const field of requiredFields) {
      if (!data[field] && data[field] !== 0) {
        return NextResponse.json(
          { error: `Field '${field}' wajib diisi.` },
          { status: 400 }
        )
      }
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json(
        { error: "Pesanan harus memiliki minimal satu produk." },
        { status: 400 }
      )
    }

    // ── 3. Build payload ────────────────────────────────────────────────────
    const payload: CreateOrderPayload = {
      user_id: user.id,
      customer_name: String(data.customer_name),
      customer_email: String(data.customer_email),
      customer_note: data.customer_note ? String(data.customer_note) : null,
      subtotal: Number(data.subtotal),
      shipping_fee: Number(data.shipping_fee),
      total: Number(data.total),
      shipping_name: String(data.shipping_name),
      shipping_phone: String(data.shipping_phone),
      shipping_address: String(data.shipping_address),
      shipping_city: String(data.shipping_city),
      shipping_province: String(data.shipping_province),
      shipping_postal_code: String(data.shipping_postal_code),
      // Biteship fields (optional — set when Biteship is used at checkout)
      courier: data.courier ? String(data.courier) : null,
      courier_code: data.courier_code ? String(data.courier_code) : null,
      shipping_service: data.shipping_service ? String(data.shipping_service) : null,
      destination_area_id: data.destination_area_id ? String(data.destination_area_id) : null,
      items: (data.items as Record<string, unknown>[]).map((item) => ({
        product_id: String(item.product_id ?? ""),
        product_name: String(item.product_name ?? ""),
        product_image: String(item.product_image ?? ""),
        selected_size: item.selected_size ? String(item.selected_size) : null,
        selected_color: item.selected_color ? String(item.selected_color) : null,
        quantity: Number(item.quantity ?? 1),
        price: Number(item.price ?? 0),
      })),
    }

    // ── 4. Create order ─────────────────────────────────────────────────────
    const { order_number } = await createOrder(payload)

    return NextResponse.json({ order_number }, { status: 201 })
  } catch (err) {
    console.error("[api/orders] POST error:", err)
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Gagal membuat pesanan. Coba lagi.",
      },
      { status: 500 }
    )
  }
}
