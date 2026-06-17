/**
 * lib/admin.ts
 *
 * Server-side admin authorization helper.
 *
 * Use this in:
 * - API Routes (app/api/*)
 * - Server Components (if added in future)
 * - Server Actions (if added in future)
 *
 * Admin is identified by: user.email === process.env.ADMIN_EMAIL
 *
 * The middleware already enforces this at the Edge for all /admin page routes.
 * This helper is the second layer for API routes that are not covered by middleware.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server"

export type AdminUser = {
  id: string
  email: string
}

/**
 * Verifies the current request is from the admin user.
 *
 * Returns the admin user if authorized.
 * Throws a structured error if not, which callers can convert to a Response.
 *
 * @throws { status: 401 } if not authenticated
 * @throws { status: 403 } if authenticated but not admin
 */
export async function getAdminUser(): Promise<AdminUser> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw { status: 401, message: "Authentication required." }
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim()

  if (!adminEmail) {
    // ADMIN_EMAIL not configured — fail closed (deny all)
    throw { status: 403, message: "Admin email not configured." }
  }

  if (user.email !== adminEmail) {
    throw { status: 403, message: "Forbidden." }
  }

  return { id: user.id, email: user.email }
}

/**
 * Convenience wrapper for API routes.
 * Returns { admin } on success, or a serializable error object.
 *
 * Usage:
 *   const result = await checkAdmin()
 *   if ('error' in result) return NextResponse.json(result, { status: result.status })
 *   const { admin } = result
 */
export async function checkAdmin(): Promise<
  { admin: AdminUser } | { error: string; status: number }
> {
  try {
    const admin = await getAdminUser()
    return { admin }
  } catch (err) {
    const e = err as { status?: number; message?: string }
    return {
      error: e.message ?? "Unauthorized.",
      status: e.status ?? 401,
    }
  }
}
