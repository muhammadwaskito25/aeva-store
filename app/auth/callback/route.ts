import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"

/**
 * Unified auth callback.
 *
 * IMPORTANT: We create the Supabase client with cookies written directly onto
 * the redirect Response — NOT via the next/headers cookies() store. This
 * ensures session cookies are included in the redirect response headers,
 * which is the only reliable way to set auth cookies from a Route Handler.
 *
 * Handles:
 *  - OAuth (Google etc.)  → Supabase sends ?code=xxx
 *  - Email confirmation   → Supabase sends ?token_hash=xxx&type=signup
 *  - Password reset       → Supabase sends ?token_hash=xxx&type=recovery
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/account"

  const successResponse = NextResponse.redirect(`${origin}${next}`)
  const errorResponse = NextResponse.redirect(`${origin}/login?error=oauth`)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) return errorResponse

  try {
    // Create client that writes session cookies directly onto successResponse
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            successResponse.cookies.set(name, value, options)
          })
        },
      },
    })

    if (code) {
      // ── OAuth flow (Google, GitHub, etc.) ─────────────────────────
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) return successResponse
    } else if (tokenHash && type) {
      // ── Email OTP flow (signup confirm, magic link, recovery) ─────
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      if (!error) return successResponse
    }
  } catch {
    // Fall through to error
  }

  return errorResponse
}
