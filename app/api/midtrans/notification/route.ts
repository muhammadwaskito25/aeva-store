import { NextResponse } from "next/server"

import Midtrans from "midtrans-client"

import { isMidtransProduction } from "@/lib/midtrans"

/** Webhook status pembayaran dari Midtrans (set di Midtrans Dashboard). */
export async function POST(request: Request) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim()

  if (!serverKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 })
  }

  try {
    const body = await request.json()

    const api = new Midtrans.CoreApi({
      isProduction: isMidtransProduction(),
      serverKey,
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "",
    })

    const status = await api.transaction.notification(body as Record<string, string>)

    console.log("[midtrans/notification]", {
      order_id: status.order_id,
      transaction_status: status.transaction_status,
      fraud_status: status.fraud_status,
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[midtrans/notification]", error)
    return NextResponse.json({ error: "Invalid notification" }, { status: 400 })
  }
}
