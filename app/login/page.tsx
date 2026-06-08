"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"

import { BrandLogo } from "@/components/BrandLogo"
import { Button } from "@/components/ui/button"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

const inputCls =
  "h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white"

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const oauthError = searchParams.get("error") === "oauth"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    oauthError ? "Terjadi kesalahan saat masuk dengan Google. Coba lagi." : null
  )

  const supabase = createSupabaseBrowserClient()

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setError(null)
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/account`,
      },
    })
    if (oauthErr) {
      setError(oauthErr.message)
      setGoogleLoading(false)
    }
    // Browser will navigate — no need to setLoading(false)
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (signInErr) throw signInErr
      router.push("/account")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal. Periksa email dan password kamu.")
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f5ef] px-4 py-16">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-10 flex flex-col items-center gap-4">
          <BrandLogo className="h-10 w-auto" />
          <div className="text-center">
            <h1 className="font-heading text-3xl tracking-tight text-neutral-900">
              Selamat Datang
            </h1>
            <p className="mt-1.5 text-sm text-neutral-500">
              Masuk ke akun AÉVA kamu
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.18)]">
          {/* Google OAuth */}
          <Button
            id="google-login-btn"
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-900 shadow-sm transition hover:bg-neutral-50 hover:shadow active:bg-neutral-100"
          >
            {googleLoading ? (
              <span className="size-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
            ) : (
              <GoogleIcon />
            )}
            {googleLoading ? "Mengarahkan…" : "Lanjutkan dengan Google"}
          </Button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-100" />
            <span className="text-xs tracking-[0.14em] text-neutral-400">atau</span>
            <div className="h-px flex-1 bg-neutral-100" />
          </div>

          {/* Email/Password */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-neutral-500">
                Email
              </span>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                placeholder="nama@email.com"
                autoComplete="email"
              />
            </label>

            <label className="block space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-neutral-500">
                  Password
                </span>
                <Link
                  href="/forgot-password"
                  className="text-xs text-neutral-400 transition hover:text-neutral-900"
                >
                  Lupa password?
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>

            {error ? (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </p>
            ) : null}

            <Button
              id="login-submit-btn"
              type="submit"
              disabled={loading || googleLoading}
              className="h-11 w-full rounded-xl bg-neutral-900 text-[11px] tracking-[0.16em] text-white uppercase hover:bg-neutral-800"
            >
              {loading ? "Masuk…" : "Masuk"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-500">
            Belum punya akun?{" "}
            <Link
              href="/signup"
              className="font-medium text-neutral-900 transition hover:underline"
            >
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
