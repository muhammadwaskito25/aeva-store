/**
 * POST /api/shipping/rates
 *
 * Proxy to Biteship Rates API.
 * Requires authentication — prevents abuse of Biteship API quota.
 *
 * Body: { destination_area_id: string, total_quantity: number }
 * Returns: { rates: ShippingRate[] }
 */

import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getShippingRates } from "@/lib/biteship"

export async function POST(request: NextRequest) {
  try {
    // ── 1. Require authentication ─────────────────────────────────────────
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login untuk melihat ongkir." },
        { status: 401 }
      )
    }

    // ── 2. Parse body ─────────────────────────────────────────────────────
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

    console.log("[api/shipping/rates] incoming body:", JSON.stringify(data))

    // Validate env vars early for a clear error message
    if (!process.env.BITESHIP_API_KEY) {
      console.error("[api/shipping/rates] BITESHIP_API_KEY is not set in env")
      return NextResponse.json(
        { error: "Konfigurasi server belum lengkap (missing BITESHIP_API_KEY)." },
        { status: 500 }
      )
    }
    if (!process.env.BITESHIP_ORIGIN_AREA_ID) {
      console.error("[api/shipping/rates] BITESHIP_ORIGIN_AREA_ID is not set in env")
      return NextResponse.json(
        { error: "Konfigurasi server belum lengkap (missing BITESHIP_ORIGIN_AREA_ID)." },
        { status: 500 }
      )
    }

    const destinationAreaId = data.destination_area_id
      ? String(data.destination_area_id)
      : null

    if (!destinationAreaId) {
      return NextResponse.json(
        { error: "destination_area_id wajib diisi." },
        { status: 400 }
      )
    }

    // ── 3. Calculate weight ───────────────────────────────────────────────
    const totalQuantity = Number(data.total_quantity ?? 1)
    const defaultWeightGrams = Number(
      process.env.BITESHIP_DEFAULT_WEIGHT_GRAMS ?? 150
    )
    const totalWeightGrams = Math.max(defaultWeightGrams * totalQuantity, 1)

    console.log(
      `[api/shipping/rates] destination=${destinationAreaId} qty=${totalQuantity} weight=${totalWeightGrams}g`
    )

    // ── 4. Fetch rates ────────────────────────────────────────────────────
    const rates = await getShippingRates({ destinationAreaId, totalWeightGrams })

    return NextResponse.json({ rates })
  } catch (err) {
    // Log full error object so it shows up in terminal
    console.error("[api/shipping/rates] UNHANDLED ERROR:")
    console.error(err)

    const message =
      err instanceof Error
        ? err.message
        : "Gagal mengambil ongkir. Coba lagi."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
