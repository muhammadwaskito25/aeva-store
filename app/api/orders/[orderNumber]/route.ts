import { NextRequest, NextResponse } from "next/server"

import { checkAdmin } from "@/lib/admin"
import { updateOrderStatus } from "@/lib/orders.repository"
import type { UpdateOrderStatusPayload } from "@/lib/orders"
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from "@/lib/orders"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    // ── 1. Verify admin identity ──────────────────────────────────────────
    const authResult = await checkAdmin()
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    // ── 2. Parse body ─────────────────────────────────────────────────────
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
    }

    const data = body as Record<string, unknown>
    const { orderNumber } = await params

    // Validate status values if provided
    if (
      data.order_status !== undefined &&
      !ORDER_STATUSES.includes(data.order_status as never)
    ) {
      return NextResponse.json(
        { error: `Invalid order_status: ${String(data.order_status)}` },
        { status: 400 }
      )
    }

    if (
      data.payment_status !== undefined &&
      !PAYMENT_STATUSES.includes(data.payment_status as never)
    ) {
      return NextResponse.json(
        { error: `Invalid payment_status: ${String(data.payment_status)}` },
        { status: 400 }
      )
    }

    // ── 3. Build update payload ───────────────────────────────────────────
    const updatePayload: UpdateOrderStatusPayload = {}
    if (data.order_status !== undefined)
      updatePayload.order_status = data.order_status as never
    if (data.payment_status !== undefined)
      updatePayload.payment_status = data.payment_status as never
    if (data.courier !== undefined)
      updatePayload.courier = data.courier ? String(data.courier) : null
    if (data.tracking_number !== undefined)
      updatePayload.tracking_number = data.tracking_number
        ? String(data.tracking_number)
        : null
    if (data.notes !== undefined)
      updatePayload.notes = data.notes ? String(data.notes) : null

    // ── 4. Update order ───────────────────────────────────────────────────
    const updatedOrder = await updateOrderStatus(orderNumber, updatePayload)

    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 })
    }

    return NextResponse.json({ order: updatedOrder })
  } catch (err) {
    console.error("[api/orders/[orderNumber]] PATCH error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal update pesanan." },
      { status: 500 }
    )
  }
}
