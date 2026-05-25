"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

const inputClassName =
  "h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createSupabaseBrowserClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) throw signInError

      router.push("/admin")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 text-neutral-900">
      <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-8 shadow-[0_18px_50px_-28px_rgba(0,0,0,0.2)]">
        <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-neutral-500">
          AEVA Admin
        </p>
        <h1 className="mt-2 font-heading text-3xl tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Masuk untuk mengelola produk di dashboard.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <label className="block space-y-2">
            <span className="text-xs font-medium tracking-[0.14em] uppercase text-neutral-500">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClassName}
              placeholder="admin@aeva.store"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-medium tracking-[0.14em] uppercase text-neutral-500">
              Password
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClassName}
              placeholder="••••••••"
            />
          </label>

          {error ? (
            <p className="text-sm text-red-700">{error}</p>
          ) : null}

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl bg-neutral-900 text-[11px] tracking-[0.16em] text-white uppercase hover:bg-neutral-800"
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </main>
  )
}
