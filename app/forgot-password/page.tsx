"use client"

import Link from "next/link"
import { useState } from "react"

import { BrandLogo } from "@/components/BrandLogo"
import { Button } from "@/components/ui/button"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

const inputCls =
  "h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createSupabaseBrowserClient()
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/account/profile`,
        }
      )
      if (resetErr) throw resetErr
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim email. Coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f5ef] px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-10 flex flex-col items-center gap-4">
          <BrandLogo className="h-10 w-auto" />
          <div className="text-center">
            <h1 className="font-heading text-3xl tracking-tight text-neutral-900">
              {sent ? "Email Terkirim" : "Lupa Password"}
            </h1>
            <p className="mt-1.5 text-sm text-neutral-500">
              {sent
                ? `Cek inbox ${email} untuk link reset password.`
                : "Masukkan email kamu dan kami akan mengirimkan link reset."}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.18)]">
          {sent ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-white text-2xl">
                ✓
              </div>
              <p className="text-sm text-neutral-600">
                Jika email terdaftar, kamu akan menerima link dalam beberapa
                menit. Periksa folder spam jika tidak masuk.
              </p>
              <Link
                href="/login"
                className="inline-block text-sm font-medium text-neutral-900 underline"
              >
                Kembali ke login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block space-y-2">
                <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-neutral-500">
                  Email
                </span>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                  placeholder="nama@email.com"
                  autoComplete="email"
                />
              </label>

              {error ? (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
                  {error}
                </p>
              ) : null}

              <Button
                id="forgot-submit-btn"
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl bg-neutral-900 text-[11px] tracking-[0.16em] text-white uppercase hover:bg-neutral-800"
              >
                {loading ? "Mengirim…" : "Kirim Link Reset"}
              </Button>

              <p className="text-center text-sm text-neutral-500">
                <Link
                  href="/login"
                  className="font-medium text-neutral-900 transition hover:underline"
                >
                  Kembali ke login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
