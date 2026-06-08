import { createSupabaseServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * OAuth callback handler.
 * Supabase redirects here after Google (or any provider) sign-in.
 * Exchanges the one-time `code` for a persistent session cookie,
 * then redirects the user to /account (or wherever `next` points).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/account"

  if (code) {
    try {
      const supabase = await createSupabaseServerClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } catch {
      // Fall through to error redirect
    }
  }

  // Something went wrong — send to login with an error param
  return NextResponse.redirect(`${origin}/login?error=oauth`)
}
