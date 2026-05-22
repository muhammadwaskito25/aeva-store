import Midtrans from "midtrans-client"

export function isMidtransConfigured(): boolean {
  return Boolean(
    process.env.MIDTRANS_SERVER_KEY?.trim() &&
      process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY?.trim()
  )
}

export function isMidtransProduction(): boolean {
  return process.env.MIDTRANS_IS_PRODUCTION === "true"
}

export function getMidtransSnapScriptUrl(): string {
  return isMidtransProduction()
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js"
}

export function getSnapClient() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim()
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY?.trim()

  if (!serverKey || !clientKey) {
    throw new Error(
      "Midtrans is not configured. Set MIDTRANS_SERVER_KEY and NEXT_PUBLIC_MIDTRANS_CLIENT_KEY."
    )
  }

  return new Midtrans.Snap({
    isProduction: isMidtransProduction(),
    serverKey,
    clientKey,
  })
}

export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL?.trim()) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
  }
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL}`
  }
  return "http://localhost:3000"
}
