"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { LogOut, Upload, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

export default function AdminSettingsPage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [authError, setAuthError] = useState(false)
  const [heroImageUrl, setHeroImageUrl] = useState<string>("")
  const [heroImagePosition, setHeroImagePosition] = useState<string>("center center")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Dragging state
  const [dragPos, setDragPos] = useState({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const dragState = useRef({ startX: 0, startY: 0, startPosX: 50, startPosY: 50 })

  function parsePosition(posStr: string) {
    if (posStr === "center top") return { x: 50, y: 0 }
    if (posStr === "center center") return { x: 50, y: 50 }
    if (posStr === "center bottom") return { x: 50, y: 100 }
    if (posStr === "left center") return { x: 0, y: 50 }
    if (posStr === "right center") return { x: 100, y: 50 }
    const match = posStr.match(/([\d.]+)%\s+([\d.]+)%/)
    if (match) {
      return { x: parseFloat(match[1]), y: parseFloat(match[2]) }
    }
    return { x: 50, y: 50 }
  }

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
        setHeroImageUrl(data.hero_image_url || "")
        const pos = data.hero_image_position || "50% 50%"
        setHeroImagePosition(pos)
        setDragPos(parsePosition(pos))
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

  async function handleHeroUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Hanya format JPEG, PNG, atau WebP yang didukung.")
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const supabase = createSupabaseBrowserClient()
      const storagePath = `hero-${Date.now()}.jpg`
      
      const { error: uploadError } = await supabase.storage
        .from("site-assets")
        .upload(storagePath, file, { contentType: file.type })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl: url },
      } = supabase.storage.from("site-assets").getPublicUrl(storagePath)

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "hero_image_url", value: url })
      })

      if (!res.ok) throw new Error("Gagal menyimpan ke database.")

      setHeroImageUrl(url)
      setMessage("Hero Image berhasil diperbarui.")
    } catch (err: any) {
      setError(err.message || "Gagal mengupload hero image.")
    } finally {
      setSaving(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handlePositionChange(position: string) {
    setHeroImagePosition(position)
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "hero_image_position", value: position })
      })

      if (!res.ok) throw new Error("Gagal menyimpan ke database.")

      setMessage("Posisi gambar berhasil diperbarui.")
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan posisi gambar.")
    } finally {
      setSaving(false)
    }
  }

  // Pointer event handlers for drag
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragState.current = { startX: e.clientX, startY: e.clientY, startPosX: dragPos.x, startPosY: dragPos.y }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    const deltaX = e.clientX - dragState.current.startX
    const deltaY = e.clientY - dragState.current.startY
    
    // Sensitivity factor (adjust if dragging feels too fast/slow)
    const sensitivity = 0.15
    let newX = dragState.current.startPosX - (deltaX * sensitivity)
    let newY = dragState.current.startPosY - (deltaY * sensitivity)
    
    newX = Math.max(0, Math.min(100, newX))
    newY = Math.max(0, Math.min(100, newY))
    
    setDragPos({ x: newX, y: newY })
    setHeroImagePosition(`${newX.toFixed(1)}% ${newY.toFixed(1)}%`)
  }

  const handlePointerUp = () => {
    if (isDragging) {
      setIsDragging(false)
      void handlePositionChange(`${dragPos.x.toFixed(1)}% ${dragPos.y.toFixed(1)}%`)
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
              Pengaturan Situs
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
              className="inline-flex h-10 items-center rounded-xl border border-neutral-900 bg-neutral-900 px-4 text-[11px] tracking-[0.14em] uppercase text-white transition"
            >
              Pengaturan
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
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">Homepage Hero Image</h2>
          <p className="mt-1 text-sm text-neutral-500 mb-6">
            Ganti gambar banner utama di halaman beranda. Rasio yang disarankan adalah 16:9 (Landscape).
          </p>

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

          <div className="space-y-4">
            <div 
              className={`relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 flex items-center justify-center select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {loading ? (
                <Loader2 className="size-6 animate-spin text-neutral-400" />
              ) : heroImageUrl ? (
                <>
                  <Image
                    src={heroImageUrl}
                    alt="Hero Image"
                    fill
                    style={{ objectPosition: heroImagePosition }}
                    className="object-cover pointer-events-none"
                  />
                  <div className="absolute bottom-3 left-3 rounded-md bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm pointer-events-none">
                    Tahan & seret gambar untuk mengatur posisi
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-neutral-400">
                  <Image width={64} height={64} src="/hero.png" alt="Default Hero" className="opacity-50 pointer-events-none" />
                  <p className="mt-2 text-sm">Default (/public/hero.png)</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-neutral-500">
                  Fokus Gambar (Position)
                </span>
                <p className="text-sm font-mono text-neutral-700">
                  {heroImagePosition}
                </p>
                <div className="flex gap-2 mt-1">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="h-7 px-3 text-[10px] rounded-lg border-neutral-300"
                    onClick={() => { 
                      setDragPos({x:50,y:50}); 
                      setHeroImagePosition("50% 50%"); 
                      void handlePositionChange("50% 50%") 
                    }}
                  >
                    Reset Tengah
                  </Button>
                </div>
              </div>

              <Button
                disabled={saving || loading}
                className="relative h-10 w-full sm:w-auto overflow-hidden rounded-xl bg-neutral-900 px-6 text-[11px] tracking-[0.14em] text-white uppercase hover:bg-neutral-800"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  onChange={handleHeroUpload}
                  disabled={saving || loading}
                />
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-3.5 animate-spin" /> Uploading...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Upload className="size-3.5" /> Upload Image
                  </span>
                )}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
