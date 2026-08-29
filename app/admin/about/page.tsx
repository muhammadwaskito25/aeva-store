"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { LogOut, Upload, Loader2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import type { AboutSettings } from "@/lib/siteSettings"

export default function AdminAboutPage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [authError, setAuthError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [settings, setSettings] = useState<AboutSettings>({
    about_hero_image: "",
    about_hero_title: "",
    about_hero_text: "",
    about_story_image: "",
    about_story_title: "",
    about_story_text: ""
  })

  useEffect(() => {
    async function checkAuthAndLoadSettings() {
      const supabase = createSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace("/admin/login")
        return
      }
      setUserEmail(user.email ?? null)

      const verifyRes = await fetch("/api/admin/verify")
      if (!verifyRes.ok) {
        setAuthError(true)
        return
      }

      await loadSettings()
    }
    void checkAuthAndLoadSettings()
  }, [router])

  async function loadSettings() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/settings")
      if (res.ok) {
        const data = await res.json()
        setSettings({
          about_hero_image: data.about_hero_image || "/about4.jpg",
          about_hero_title: data.about_hero_title || "Crafted for\nQuiet Elegance",
          about_hero_text: data.about_hero_text || "AÉVA crafts refined scarves for modern women who value softness, simplicity, and timeless drape. Founded by women, for women — every scarf is a quiet declaration of strength, grace, and the freedom to wear on your own terms.",
          about_story_image: data.about_story_image || "/about.png",
          about_story_title: data.about_story_title || "An effortless presence",
          about_story_text: data.about_story_text || "AÉVA was born from a simple belief — that scarves should feel timeless, effortless, and made for every woman. We wanted to create pieces that are easy to wear, soft in presence, and naturally elegant without feeling excessive.\n\nThrough refined fabrics, neutral tones, and thoughtful simplicity, each scarf is designed to become a part of everyday moments — comfortable, versatile, and quietly beautiful.\n\nMade for every woman, every style, and every season."
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  async function handleSaveText(key: keyof AboutSettings, value: string) {
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value })
      })

      if (!res.ok) throw new Error("Gagal menyimpan ke database.")

      setSettings(prev => ({ ...prev, [key]: value }))
      setMessage("Pengaturan teks berhasil disimpan.")
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan teks.")
    } finally {
      setSaving(false)
    }
  }

  async function handleImageUpload(key: keyof AboutSettings, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = "" 

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Hanya format JPEG, PNG, atau WebP yang didukung.")
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const supabase = createSupabaseBrowserClient()
      const storagePath = `about-${Date.now()}-${file.name}`
      
      const { error: uploadError } = await supabase.storage
        .from("site-assets")
        .upload(storagePath, file, { contentType: file.type })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl: url },
      } = supabase.storage.from("site-assets").getPublicUrl(storagePath)

      await handleSaveText(key, url)
      setMessage("Gambar berhasil diperbarui.")
    } catch (err: any) {
      setError(err.message || "Gagal mengupload gambar.")
      setSaving(false)
    }
  }

  if (authError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 text-sm text-neutral-500">
        Akses ditolak.
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:py-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Pengaturan About Page
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {userEmail ? (
              <p className="text-sm text-neutral-500">{userEmail}</p>
            ) : null}
            <a
              href="/admin"
              className="inline-flex h-10 items-center rounded-xl border border-neutral-200 px-4 text-[11px] tracking-[0.14em] uppercase text-neutral-700 transition hover:border-neutral-400"
            >
              Produk
            </a>
            <a
              href="/admin/settings"
              className="inline-flex h-10 items-center rounded-xl border border-neutral-200 px-4 text-[11px] tracking-[0.14em] uppercase text-neutral-700 transition hover:border-neutral-400"
            >
              Pengaturan Utama
            </a>
            <a
              href="/admin/about"
              className="inline-flex h-10 items-center rounded-xl border border-neutral-900 bg-neutral-900 px-4 text-[11px] tracking-[0.14em] uppercase text-white transition"
            >
              Halaman About
            </a>
            <a
              href="/admin/orders"
              className="inline-flex h-10 items-center rounded-xl border border-neutral-200 px-4 text-[11px] tracking-[0.14em] uppercase text-neutral-700 transition hover:border-neutral-400"
            >
              Pesanan
            </a>
            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              className="h-10 rounded-xl border-neutral-300 text-[11px] tracking-[0.14em] uppercase"
            >
              <LogOut className="size-3.5" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-neutral-400" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* HERO SECTION */}
            <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold tracking-tight">Bagian Hero</h2>
              <p className="mt-1 mb-6 text-sm text-neutral-500">
                Gambar dan teks utama di bagian paling atas halaman Our Story.
              </p>

              <div className="space-y-6">
                {/* Image */}
                <div>
                  <label className="mb-2 block text-[11px] font-medium tracking-[0.14em] uppercase text-neutral-500">
                    Gambar Hero
                  </label>
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 flex items-center justify-center">
                    {settings.about_hero_image ? (
                      <Image
                        src={settings.about_hero_image}
                        alt="Hero About"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-neutral-400">Tidak ada gambar</span>
                    )}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      disabled={saving}
                      className="relative h-10 w-full sm:w-auto overflow-hidden rounded-xl bg-neutral-900 px-6 text-[11px] tracking-[0.14em] text-white uppercase hover:bg-neutral-800"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                        onChange={(e) => handleImageUpload("about_hero_image", e)}
                        disabled={saving}
                      />
                      {saving ? (
                        <span className="flex items-center gap-2"><Loader2 className="size-3.5 animate-spin" /> Uploading...</span>
                      ) : (
                        <span className="flex items-center gap-2"><Upload className="size-3.5" /> Ganti Gambar</span>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Text */}
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-[11px] font-medium tracking-[0.14em] uppercase text-neutral-500">
                      Judul Utama
                    </label>
                    <textarea
                      rows={2}
                      value={settings.about_hero_title}
                      onChange={(e) => setSettings({ ...settings, about_hero_title: e.target.value })}
                      onBlur={() => handleSaveText("about_hero_title", settings.about_hero_title)}
                      className="w-full rounded-xl border border-neutral-200 p-3 text-sm outline-none transition focus:border-neutral-900"
                      placeholder="Gunakan baris baru (enter) untuk pemisahan teks"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-medium tracking-[0.14em] uppercase text-neutral-500">
                      Teks Deskripsi
                    </label>
                    <textarea
                      rows={4}
                      value={settings.about_hero_text}
                      onChange={(e) => setSettings({ ...settings, about_hero_text: e.target.value })}
                      onBlur={() => handleSaveText("about_hero_text", settings.about_hero_text)}
                      className="w-full rounded-xl border border-neutral-200 p-3 text-sm outline-none transition focus:border-neutral-900"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* BRAND STORY SECTION */}
            <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold tracking-tight">Bagian Brand Story</h2>
              <p className="mt-1 mb-6 text-sm text-neutral-500">
                Sejarah atau filosofi utama brand.
              </p>

              <div className="space-y-6">
                {/* Image */}
                <div>
                  <label className="mb-2 block text-[11px] font-medium tracking-[0.14em] uppercase text-neutral-500">
                    Gambar Brand Story
                  </label>
                  <div className="relative aspect-[4/5] w-full max-w-sm overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 flex items-center justify-center">
                    {settings.about_story_image ? (
                      <Image
                        src={settings.about_story_image}
                        alt="Story About"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-neutral-400">Tidak ada gambar</span>
                    )}
                  </div>
                  <div className="mt-4 flex justify-start">
                    <Button
                      disabled={saving}
                      className="relative h-10 w-full sm:w-auto overflow-hidden rounded-xl bg-neutral-900 px-6 text-[11px] tracking-[0.14em] text-white uppercase hover:bg-neutral-800"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                        onChange={(e) => handleImageUpload("about_story_image", e)}
                        disabled={saving}
                      />
                      {saving ? (
                        <span className="flex items-center gap-2"><Loader2 className="size-3.5 animate-spin" /> Uploading...</span>
                      ) : (
                        <span className="flex items-center gap-2"><Upload className="size-3.5" /> Ganti Gambar</span>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Text */}
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-[11px] font-medium tracking-[0.14em] uppercase text-neutral-500">
                      Judul Story
                    </label>
                    <input
                      type="text"
                      value={settings.about_story_title}
                      onChange={(e) => setSettings({ ...settings, about_story_title: e.target.value })}
                      onBlur={() => handleSaveText("about_story_title", settings.about_story_title)}
                      className="h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none transition focus:border-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-medium tracking-[0.14em] uppercase text-neutral-500">
                      Teks Paragraf Story
                    </label>
                    <p className="mb-2 text-xs text-neutral-400">
                      Gunakan baris baru (enter 2x) untuk membuat paragraf baru.
                    </p>
                    <textarea
                      rows={10}
                      value={settings.about_story_text}
                      onChange={(e) => setSettings({ ...settings, about_story_text: e.target.value })}
                      onBlur={() => handleSaveText("about_story_text", settings.about_story_text)}
                      className="w-full rounded-xl border border-neutral-200 p-3 text-sm outline-none transition focus:border-neutral-900"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
