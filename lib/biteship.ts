/**
 * lib/biteship.ts
 *
 * Server-only Biteship API client.
 * NEVER import this in client components.
 *
 * Endpoints used:
 *   GET  /v1/maps/areas   — Area autocomplete (search kecamatan)
 *   POST /v1/rates/couriers — Get shipping rates
 */

const BITESHIP_BASE_URL = "https://api.biteship.com"

function getBiteshipApiKey(): string {
  const key = process.env.BITESHIP_API_KEY
  if (!key) throw new Error("BITESHIP_API_KEY env variable is not set.")
  return key
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type BiteshipArea = {
  id: string
  name: string
  country_code: string
  administrative_division_level_1_name: string // Province
  administrative_division_level_2_name: string // City
  administrative_division_level_3_name: string // District
  postal_code: number
}

export type ShippingRate = {
  courier_name: string         // e.g. "JNE"
  courier_code: string         // e.g. "jne"
  courier_service_name: string // e.g. "REG"
  description: string          // e.g. "Layanan reguler"
  duration: string             // e.g. "2 - 3 Days"
  price: number                // in IDR
  service_type: string         // e.g. "standard"
}

type BiteshipRatesResponse = {
  success: boolean
  message?: string
  pricing?: {
    courier_name: string
    courier_code: string
    courier_service_name: string
    description: string
    duration: string
    shipment_duration_range: string
    shipment_duration_unit: string
    service_type: string
    shipping_type: string
    price: number
    type: string
  }[]
}

type BiteshipAreasResponse = {
  success: boolean
  areas: {
    id: string
    name: string
    country_name: string
    country_code: string
    administrative_division_level_1_name: string
    administrative_division_level_1_type: string
    administrative_division_level_2_name: string
    administrative_division_level_2_type: string
    administrative_division_level_3_name: string
    administrative_division_level_3_type: string
    postal_code: number
  }[]
}

// ─── Area Search (autocomplete) ───────────────────────────────────────────────

/**
 * Search for areas by name string.
 * Used to build the kecamatan autocomplete in checkout.
 */
export async function searchAreas(input: string): Promise<BiteshipArea[]> {
  if (!input || input.trim().length < 3) return []

  const apiKey = getBiteshipApiKey()
  const url = new URL(`${BITESHIP_BASE_URL}/v1/maps/areas`)
  url.searchParams.set("countries", "ID")
  url.searchParams.set("input", input.trim())
  url.searchParams.set("type", "single")

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      authorization: apiKey,
      "content-type": "application/json",
    },
  })

  if (!response.ok) {
    const text = await response.text()
    console.error("[biteship] searchAreas failed:", response.status, text)
    return []
  }

  const data = (await response.json()) as BiteshipAreasResponse

  if (!data.success || !Array.isArray(data.areas)) return []

  return data.areas.map((area) => ({
    id: area.id,
    name: area.name,
    country_code: area.country_code,
    administrative_division_level_1_name: area.administrative_division_level_1_name,
    administrative_division_level_2_name: area.administrative_division_level_2_name,
    administrative_division_level_3_name: area.administrative_division_level_3_name,
    postal_code: area.postal_code,
  }))
}

// ─── Get Shipping Rates ───────────────────────────────────────────────────────

type GetRatesParams = {
  destinationAreaId: string
  totalWeightGrams: number
}

/**
 * Fetch available shipping rates from origin (env) to destination area.
 * Returns sorted by price ascending.
 */
export async function getShippingRates(
  params: GetRatesParams
): Promise<ShippingRate[]> {
  const apiKey = getBiteshipApiKey()
  const originAreaId = process.env.BITESHIP_ORIGIN_AREA_ID
  const originPostalCode = process.env.BITESHIP_ORIGIN_POSTAL_CODE

  if (!originAreaId || !originPostalCode) {
    throw new Error("BITESHIP_ORIGIN_AREA_ID or BITESHIP_ORIGIN_POSTAL_CODE is not set.")
  }

  const weightGrams = Math.max(params.totalWeightGrams, 1)

  const requestBody = {
    origin_area_id: originAreaId,
    destination_area_id: params.destinationAreaId,
    couriers: "anteraja,jne,jnt,sicepat,sap,ninja,tiki,pos,lion,rex",
    items: [
      {
        name: "Produk AEVA",
        description: "Kain scarf",
        value: 100000,
        length: 30,
        width: 20,
        height: 5,
        weight: weightGrams,  // number, bukan string
        quantity: 1,
      },
    ],
  }

  console.log("[biteship] getShippingRates → request body:", JSON.stringify(requestBody, null, 2))

  const response = await fetch(`${BITESHIP_BASE_URL}/v1/rates/couriers`, {
    method: "POST",
    headers: {
      authorization: apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(requestBody),
    cache: "no-store",
  })

  // Read body once as text so we can log it AND parse it
  const responseText = await response.text()
  console.log(`[biteship] getShippingRates → HTTP ${response.status}:`, responseText)

  if (!response.ok) {
    // Try to parse Biteship error message
    let biteshipMessage = `HTTP ${response.status}`
    try {
      const errJson = JSON.parse(responseText) as { error?: string; message?: string }
      biteshipMessage = errJson.error ?? errJson.message ?? biteshipMessage
    } catch { /* ignore parse error */ }
    throw new Error(`Biteship error: ${biteshipMessage}`)
  }

  const data = JSON.parse(responseText) as BiteshipRatesResponse

  // Biteship returns success:false even on HTTP 200 in some cases (e.g. no balance)
  if (!data.success) {
    const biteshipError = (data as unknown as { error?: string; message?: string }).error
      ?? (data as unknown as { error?: string; message?: string }).message
      ?? "Unknown Biteship error"
    console.error("[biteship] getShippingRates → success:false:", biteshipError)
    throw new Error(`Biteship: ${biteshipError}`)
  }

  if (!Array.isArray(data.pricing)) {
    console.error("[biteship] getShippingRates → no pricing array in response:", data)
    return []
  }

  const rates: ShippingRate[] = data.pricing.map((p) => ({
    courier_name: p.courier_name,
    courier_code: p.courier_code,
    courier_service_name: p.courier_service_name,
    description: p.description ?? "",
    duration: p.duration ?? "",
    price: p.price,
    service_type: p.service_type ?? "",
  }))

  console.log(`[biteship] getShippingRates → ${rates.length} rate(s) found`)

  // Sort by price ascending
  return rates.sort((a, b) => a.price - b.price)
}
