import { createSupabaseServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"

/**
 * Unified auth callback handler.
 *
 * Handles two different Supabase flows:
 * 1. OAuth (Google) — Supabase sends ?code=xxx after provider redirects back
 * 2. Email OTP (signup confirmation, magic link, password reset) — Supabase
 *    sends ?token_hash=xxx&type=signup|recovery|...
 *
 * Both are exchanged for a session cookie, then the user is forwarded to `next`.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/account"

  try {
    const supabase = await createSupabaseServerClient()

    if (code) {
      // ── OAuth flow (Google, etc.) ───────────────────────────────────
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } else if (tokenHash && type) {
      // ── Email OTP flow (signup confirm, magic link, password reset) ─
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  } catch {
    // Fall through to error redirect
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`)
}
