"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Navbar } from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

const inputCls =
  "h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"

export default function ProfilePage() {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient()
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.replace("/login"); return }

      setUser(u)

      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", u.id)
        .maybeSingle()

      setFullName(
        (prof as { full_name: string | null } | null)?.full_name ??
          u.user_metadata?.full_name ??
          ""
      )
      setLoading(false)
    }
    void load()
  }, [router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      if (!user) throw new Error("Sesi tidak ditemukan.")
      const supabase = createSupabaseBrowserClient()

      const { error: updateErr } = await supabase
        .from("profiles")
        .upsert({ id: user.id, full_name: fullName.trim(), updated_at: new Date().toISOString() })

      if (updateErr) throw updateErr

      setSuccess(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan. Coba lagi.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f5ef] text-sm text-neutral-500">
        Memuat profil…
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f8f5ef] text-neutral-900">
      <Navbar />

      <section className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-[11px] tracking-[0.16em] uppercase text-neutral-500">
          <Link href="/account" className="transition hover:text-neutral-900">
            Akun
          </Link>
          <span>/</span>
          <span className="text-neutral-900">Profil</span>
        </nav>

        <div className="mb-8">
          <h1 className="font-heading text-3xl tracking-tight sm:text-4xl">
            Edit Profil
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Perbarui informasi akun kamu.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.15)]">
          <form onSubmit={handleSave} className="space-y-5">
            <label className="block space-y-2">
              <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-neutral-500">
                Nama Lengkap
              </span>
              <input
                id="profile-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputCls}
                placeholder="Nama kamu"
                autoComplete="name"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-neutral-500">
                Email
              </span>
              <input
                type="email"
                value={user?.email ?? ""}
                className={inputCls}
                disabled
                readOnly
              />
              <p className="text-xs text-neutral-400">
                Email tidak dapat diubah.
              </p>
            </label>

            {error ? (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Profil berhasil disimpan.
              </p>
            ) : null}

            <div className="flex gap-3 pt-2">
              <Button
                id="profile-save-btn"
                type="submit"
                disabled={saving}
                className="h-11 rounded-xl bg-neutral-900 px-8 text-[11px] tracking-[0.16em] text-white uppercase hover:bg-neutral-800"
              >
                {saving ? "Menyimpan…" : "Simpan"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="h-11 rounded-xl border-neutral-300 px-6 text-[11px] tracking-[0.14em] uppercase"
              >
                Batal
              </Button>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
