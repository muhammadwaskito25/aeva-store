"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Navbar } from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

type Profile = {
  full_name: string | null
}

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient()
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.replace("/login"); return }

      setUser(u)

      // Upsert profile row (handles first-time login via Google/email)
      await supabase.from("profiles").upsert(
        { id: u.id, full_name: u.user_metadata?.full_name ?? null },
        { onConflict: "id", ignoreDuplicates: true }
      )

      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", u.id)
        .maybeSingle()

      setProfile(prof as Profile | null)
      setLoading(false)
    }
    void load()
  }, [router])

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f5ef] text-sm text-neutral-500">
        Memuat akun…
      </main>
    )
  }

  const displayName =
    profile?.full_name ??
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    "Pelanggan"

  return (
    <main className="min-h-screen bg-[#f8f5ef] text-neutral-900">
      <Navbar />

      <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] tracking-[0.22em] uppercase text-neutral-500">
              Akun Saya
            </p>
            <h1 className="mt-2 font-heading text-3xl tracking-tight sm:text-4xl">
              Halo, {displayName}
            </h1>
            <p className="mt-1.5 text-sm text-neutral-500">{user?.email}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-4 h-10 rounded-xl border-neutral-300 text-[11px] tracking-[0.14em] uppercase sm:mt-0"
          >
            {loggingOut ? "Keluar…" : "Logout"}
          </Button>
        </div>

        {/* Menu cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/account/profile"
            className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.15)] transition hover:shadow-[0_18px_50px_-24px_rgba(0,0,0,0.22)] hover:border-neutral-300"
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 transition group-hover:bg-neutral-900 group-hover:text-white">
              <svg viewBox="0 0 20 20" fill="currentColor" className="size-5">
                <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
              </svg>
            </div>
            <h2 className="text-base font-medium tracking-tight">Profil</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Edit nama dan informasi akun kamu
            </p>
          </Link>

          <Link
            href="/account/orders"
            className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.15)] transition hover:shadow-[0_18px_50px_-24px_rgba(0,0,0,0.22)] hover:border-neutral-300"
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 transition group-hover:bg-neutral-900 group-hover:text-white">
              <svg viewBox="0 0 20 20" fill="currentColor" className="size-5">
                <path d="M4 4a2 2 0 0 0-2 2v1h16V6a2 2 0 0 0-2-2H4ZM18 9H2v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9ZM4 13a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Zm5-1a1 1 0 1 0 0 2h1a1 1 0 1 0 0-2H9Z" />
              </svg>
            </div>
            <h2 className="text-base font-medium tracking-tight">
              Riwayat Pesanan
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Lihat dan lacak semua pesanan kamu
            </p>
          </Link>
        </div>
      </section>
    </main>
  )
}
