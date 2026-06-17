import { NextRequest, NextResponse } from "next/server"

import { getAppBaseUrl, getSnapClient, isMidtransConfigured } from "@/lib/midtrans"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type SnapItem = {
  id: string
  name: string
  price: number
  quantity: number
}

type SnapCustomer = {
  firstName: string
  lastName: string
  email: string
  phone: string
}

type SnapRequestBody = {
  items: SnapItem[]
  shipping: number
  customer: SnapCustomer
}

export async function POST(request: NextRequest) {
  // ── Require authentication (any logged-in customer) ───────────────────────
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    )
  }

  if (!isMidtransConfigured()) {
    return NextResponse.json(
      { error: "Midtrans belum dikonfigurasi." },
      { status: 500 }
    )
  }

  try {
    const body = (await request.json()) as SnapRequestBody
    const { items, shipping, customer } = body

    if (!items?.length || !customer?.email) {
      return NextResponse.json(
        { error: "Data pesanan atau customer tidak lengkap." },
        { status: 400 }
      )
    }

    const itemDetails = [
      ...items.map((item) => ({
        id: item.id,
        name: item.name.slice(0, 50),
        price: Math.round(item.price),
        quantity: item.quantity,
      })),
      {
        id: "shipping",
        name: "Shipping",
        price: Math.round(shipping),
        quantity: 1,
      },
    ]

    const grossAmount = itemDetails.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )

    const orderId = `AEVA-${Date.now()}`
    const baseUrl = getAppBaseUrl()
    const snap = getSnapClient()

    const transaction = await snap.createTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      item_details: itemDetails,
      customer_details: {
        first_name: customer.firstName || "AEVA",
        last_name: customer.lastName || "Customer",
        email: customer.email,
        phone: customer.phone || "08123456789",
      },
      callbacks: {
        finish: `${baseUrl}/checkout/success?order_id=${orderId}`,
      },
    })

    return NextResponse.json({
      token: transaction.token,
      orderId,
    })
  } catch (error) {
    console.error("[midtrans/snap]", error)
    return NextResponse.json(
      { error: "Gagal membuat transaksi Midtrans." },
      { status: 500 }
    )
  }
}
