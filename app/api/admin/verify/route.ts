/**
 * GET /api/admin/verify
 *
 * Lightweight endpoint to verify admin identity from client components.
 * Returns 200 if the caller is the admin, 401/403 otherwise.
 *
 * Used by client-side admin pages as a second layer after middleware,
 * to protect against stale middleware cache edge cases.
 */

import { NextResponse } from "next/server"
import { checkAdmin } from "@/lib/admin"

export async function GET() {
  const result = await checkAdmin()

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({ ok: true, email: result.admin.email })
}
