import { NextResponse } from "next/server"
import { checkAdmin } from "@/lib/admin"
import { fetchAllOrders } from "@/lib/orders.repository"

export async function GET() {
    const result = await checkAdmin()
    if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const orders = await fetchAllOrders()
    return NextResponse.json(orders)
}