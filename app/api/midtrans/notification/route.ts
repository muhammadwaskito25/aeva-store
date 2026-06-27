import { NextResponse } from "next/server"
import Midtrans from "midtrans-client"

import { isMidtransProduction } from "@/lib/midtrans"
import { updateOrderMidtransData } from "@/lib/orders.repository"
import type { PaymentStatus } from "@/lib/orders"

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

    // This also verifies the signature
    const status = await api.transaction.notification(body as Record<string, string>)

    const orderId = status.order_id
    const transactionStatus = status.transaction_status
    const fraudStatus = status.fraud_status

    console.log("[midtrans/notification] order:", orderId, "status:", transactionStatus)

    let paymentStatus: PaymentStatus = "Pending"

    if (transactionStatus === "capture") {
      if (fraudStatus === "challenge") {
        paymentStatus = "Pending"
      } else if (fraudStatus === "accept") {
        paymentStatus = "Paid"
      }
    } else if (transactionStatus === "settlement") {
      paymentStatus = "Paid"
    } else if (
      transactionStatus === "cancel" ||
      transactionStatus === "deny" ||
      transactionStatus === "expire"
    ) {
      paymentStatus = "Failed"
    } else if (transactionStatus === "pending") {
      paymentStatus = "Pending"
    } else if (transactionStatus === "refund" || transactionStatus === "partial_refund") {
      paymentStatus = "Refunded"
    }

    // Update to DB
    const statusData = status as Record<string, any>
    const updated = await updateOrderMidtransData(orderId, {
      payment_status: paymentStatus,
      midtrans_transaction_id: statusData.transaction_id,
      midtrans_payment_type: statusData.payment_type,
      midtrans_metadata: statusData,
    })

    if (!updated) {
      console.error("[midtrans/notification] Order not found in DB:", orderId)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[midtrans/notification] Error processing:", error)
    return NextResponse.json({ error: "Invalid notification" }, { status: 400 })
  }
}
