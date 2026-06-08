import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // ── Admin routes ──────────────────────────────────────────────────────────
  const isAdminLoginPage = pathname === "/admin/login"

  if (!user && pathname.startsWith("/admin") && !isAdminLoginPage) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/admin/login"
    return NextResponse.redirect(redirectUrl)
  }

  if (user && isAdminLoginPage) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/admin"
    return NextResponse.redirect(redirectUrl)
  }

  // ── Customer account routes ───────────────────────────────────────────────
  if (!user && pathname.startsWith("/account")) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    redirectUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // ── Auth pages — redirect away if already logged in ───────────────────────
  const isCustomerAuthPage =
    pathname === "/login" || pathname === "/signup"

  if (user && isCustomerAuthPage) {
    const next = request.nextUrl.searchParams.get("next") ?? "/account"
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = next
    redirectUrl.search = ""
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}
