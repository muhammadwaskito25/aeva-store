/**
 * GET /api/shipping/areas?input=<search_string>
 *
 * Proxy to Biteship Maps API for kecamatan autocomplete.
 * Public endpoint (no auth required) — API key stays server-side.
 * Returns max 10 results.
 */

import { NextRequest, NextResponse } from "next/server"
import { searchAreas } from "@/lib/biteship"

export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get("input") ?? ""

  if (input.trim().length < 3) {
    return NextResponse.json({ areas: [] })
  }

  try {
    const areas = await searchAreas(input)
    return NextResponse.json({ areas: areas.slice(0, 10) })
  } catch (err) {
    console.error("[api/shipping/areas] error:", err)
    return NextResponse.json(
      { error: "Gagal mencari area. Coba lagi." },
      { status: 500 }
    )
  }
}
