"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { LogOut, Upload, Loader2, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import type { AboutSettings, AboutValue, AboutLookbook, AboutTestimonial } from "@/lib/siteSettings"

const AVAILABLE_ICONS = ["Sparkles", "Feather", "Sun", "Star", "Heart", "Leaf", "Diamond", "Crown", "Check"]

const AVAILABLE_RATIOS = [
  { label: "Layar Penuh (Khusus Hero)", value: "min-h-[78vh]" },
  { label: "16:9 (Lanskap)", value: "aspect-video" },
  { label: "9:16 (Potret Panjang)", value: "aspect-[9/16]" },
  { label: "1:1 (Kotak)", value: "aspect-square" },
  { label: "4:5 (Potret IG)", value: "aspect-[4/5]" },
  { label: "5:4 (Lanskap Pendek)", value: "aspect-[5/4]" },
  { label: "Otomatis (Original)", value: "aspect-auto" },
]

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
    about_hero_position: "50% 50%",
    about_hero_ratio: "min-h-[78vh]",
    about_hero_title: "",
    about_hero_text: "",
    about_story_image: "",
    about_story_position: "50% 50%",
    about_story_ratio: "aspect-[4/5]",
    about_story_title: "",
    about_story_text: "",
    about_values: [],
    about_lookbook: [],
    about_testimonials: []
  })

  // Dragging state
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
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
        
        const safeParseJSON = <T,>(str: string | undefined, fallback: T): T => {
          if (!str) return fallback
          try { return JSON.parse(str) as T } catch { return fallback }
        }

        const defaultValues: AboutValue[] = [
          { id: "v1", title: "Timeless Design", description: "Silhouettes that transcend seasons — restrained, intentional, and made to feel relevant for years.", icon: "Sparkles" },
          { id: "v2", title: "Soft Comfort", description: "Refined fabrics chosen for gentle drape and breathable wear, elevating everyday movement.", icon: "Feather" },
          { id: "v3", title: "Everyday Elegance", description: "Quiet luxury for modern modestwear — polished enough for occasion, effortless for daily life.", icon: "Sun" },
        ]

        const defaultLookbook: AboutLookbook[] = [
          { id: "lb1", url: "/hero.png", alt: "AÉVA editorial — neutral tones", position: "50% 50%", ratio: "aspect-[4/5]" },
          { id: "lb2", url: "/about2.jpg", alt: "Silk drape detail", position: "50% 50%", ratio: "aspect-[5/4]" },
          { id: "lb3", url: "/about3.jpg", alt: "Soft fold styling", position: "50% 50%", ratio: "aspect-[5/4]" },
        ]

        const defaultTestimonials: AboutTestimonial[] = [
          { id: "t1", quote: "AÉVA scarves feel incredibly refined. The fabric is light, graceful, and elevates every outfit.", name: "Mina K.", location: "Seoul" },
          { id: "t2", quote: "Minimal, elegant, and timeless. This is exactly the quiet luxury look I wanted.", name: "Aiko T.", location: "Tokyo" },
        ]

        setSettings({
          about_hero_image: data.about_hero_image || "/about4.jpg",
          about_hero_position: data.about_hero_position || "50% 50%",
          about_hero_ratio: data.about_hero_ratio || "min-h-[78vh]",
          about_hero_title: data.about_hero_title || "Crafted for\nQuiet Elegance",
          about_hero_text: data.about_hero_text || "AÉVA crafts refined scarves for modern women who value softness, simplicity, and timeless drape. Founded by women, for women — every scarf is a quiet declaration of strength, grace, and the freedom to wear on your own terms.",
          about_story_image: data.about_story_image || "/about.png",
          about_story_position: data.about_story_position || "50% 50%",
          about_story_ratio: data.about_story_ratio || "aspect-[4/5]",
          about_story_title: data.about_story_title || "An effortless presence",
          about_story_text: data.about_story_text || "AÉVA was born from a simple belief — that scarves should feel timeless, effortless, and made for every woman. We wanted to create pieces that are easy to wear, soft in presence, and naturally elegant without feeling excessive.\n\nThrough refined fabrics, neutral tones, and thoughtful simplicity, each scarf is designed to become a part of everyday moments — comfortable, versatile, and quietly beautiful.\n\nMade for every woman, every style, and every season.",
          about_values: safeParseJSON<AboutValue[]>(data.about_values, defaultValues),
          about_lookbook: safeParseJSON<AboutLookbook[]>(data.about_lookbook, defaultLookbook),
          about_testimonials: safeParseJSON<AboutTestimonial[]>(data.about_testimonials, defaultTestimonials),
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

  async function handleSaveSetting(key: keyof AboutSettings, value: string | any[]) {
    setSaving(true)
    setError(null)
    setMessage(null)

    const strValue = typeof value === 'string' ? value : JSON.stringify(value)

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: strValue })
      })

      if (!res.ok) throw new Error("Gagal menyimpan ke database.")

      setSettings(prev => ({ ...prev, [key]: value }))
      setMessage(`Pengaturan berhasil disimpan.`)
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan pengaturan.")
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

      await handleSaveSetting(key, url)
    } catch (err: any) {
      setError(err.message || "Gagal mengupload gambar.")
      setSaving(false)
    }
  }

  // --- Array Management Handlers ---

  function moveItem<T>(arr: T[], index: number, direction: 'up' | 'down'): T[] {
    const newArr = [...arr]
    if (direction === 'up' && index > 0) {
      [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]]
    } else if (direction === 'down' && index < newArr.length - 1) {
      [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]]
    }
    return newArr
  }

  // Values
  function addValue() {
    const newItem: AboutValue = { id: `v-${Date.now()}`, title: "New Value", description: "Description", icon: "Sparkles" }
    handleSaveSetting("about_values", [...settings.about_values, newItem])
  }
  function updateValue(index: number, updates: Partial<AboutValue>) {
    const newArr = [...settings.about_values]
    newArr[index] = { ...newArr[index], ...updates }
    setSettings({ ...settings, about_values: newArr }) // Optimistic update
  }
  function removeValue(index: number) {
    const newArr = settings.about_values.filter((_, i) => i !== index)
    handleSaveSetting("about_values", newArr)
  }
  function moveValue(index: number, direction: 'up' | 'down') {
    handleSaveSetting("about_values", moveItem(settings.about_values, index, direction))
  }

  // Lookbook
  async function addLookbookImage(e: React.ChangeEvent<HTMLInputElement>) {
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
      const storagePath = `lookbook-${Date.now()}-${file.name}`
      
      const { error: uploadError } = await supabase.storage
        .from("site-assets")
        .upload(storagePath, file, { contentType: file.type })

      if (uploadError) throw uploadError

      const { data: { publicUrl: url } } = supabase.storage.from("site-assets").getPublicUrl(storagePath)

      const newItem: AboutLookbook = { id: `lb-${Date.now()}`, url, alt: "Editorial image", position: "50% 50%", ratio: "aspect-[4/5]" }
      await handleSaveSetting("about_lookbook", [...settings.about_lookbook, newItem])
    } catch (err: any) {
      setError(err.message || "Gagal mengupload gambar.")
      setSaving(false)
    }
  }
  function updateLookbook(index: number, updates: Partial<AboutLookbook>) {
    const newArr = [...settings.about_lookbook]
    newArr[index] = { ...newArr[index], ...updates }
    setSettings({ ...settings, about_lookbook: newArr })
  }
  function removeLookbook(index: number) {
    const newArr = settings.about_lookbook.filter((_, i) => i !== index)
    handleSaveSetting("about_lookbook", newArr)
  }
  function moveLookbook(index: number, direction: 'up' | 'down') {
    handleSaveSetting("about_lookbook", moveItem(settings.about_lookbook, index, direction))
  }

  // Pointer event handlers for drag
  const handlePointerDown = (e: React.PointerEvent, id: string, currentPosition: string) => {
    e.preventDefault()
    setActiveDragId(id)
    const pos = parsePosition(currentPosition)
    dragState.current = { startX: e.clientX, startY: e.clientY, startPosX: pos.x, startPosY: pos.y }
  }

  const handlePointerMove = (e: React.PointerEvent, id: string) => {
    if (activeDragId !== id) return
    const deltaX = e.clientX - dragState.current.startX
    const deltaY = e.clientY - dragState.current.startY
    
    const sensitivity = 0.15
    let newX = dragState.current.startPosX - (deltaX * sensitivity)
    let newY = dragState.current.startPosY - (deltaY * sensitivity)
    
    newX = Math.max(0, Math.min(100, newX))
    newY = Math.max(0, Math.min(100, newY))
    
    const newPos = `${newX.toFixed(1)}% ${newY.toFixed(1)}%`

    if (id === "hero") {
      setSettings(s => ({ ...s, about_hero_position: newPos }))
    } else if (id === "story") {
      setSettings(s => ({ ...s, about_story_position: newPos }))
    } else {
      const idx = settings.about_lookbook.findIndex(lb => lb.id === id)
      if (idx !== -1) {
        const newArr = [...settings.about_lookbook]
        newArr[idx] = { ...newArr[idx], position: newPos }
        setSettings(s => ({ ...s, about_lookbook: newArr }))
      }
    }
  }

  const handlePointerUp = () => {
    if (activeDragId) {
      const id = activeDragId
      setActiveDragId(null)
      
      if (id === "hero") {
        void handleSaveSetting("about_hero_position", settings.about_hero_position)
      } else if (id === "story") {
        void handleSaveSetting("about_story_position", settings.about_story_position)
      } else {
        void handleSaveSetting("about_lookbook", settings.about_lookbook)
      }
    }
  }

  // Testimonials
  function addTestimonial() {
    const newItem: AboutTestimonial = { id: `t-${Date.now()}`, quote: "Review text...", name: "Name", location: "City" }
    handleSaveSetting("about_testimonials", [...settings.about_testimonials, newItem])
  }
  function updateTestimonial(index: number, updates: Partial<AboutTestimonial>) {
    const newArr = [...settings.about_testimonials]
    newArr[index] = { ...newArr[index], ...updates }
    setSettings({ ...settings, about_testimonials: newArr })
  }
  function removeTestimonial(index: number) {
    const newArr = settings.about_testimonials.filter((_, i) => i !== index)
    handleSaveSetting("about_testimonials", newArr)
  }
  function moveTestimonial(index: number, direction: 'up' | 'down') {
    handleSaveSetting("about_testimonials", moveItem(settings.about_testimonials, index, direction))
  }

  if (authError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 text-sm text-neutral-500">
        Akses ditolak.
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 pb-20">
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

      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        
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
            
            {/* 1. HERO SECTION */}
            <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold tracking-tight">Bagian Hero</h2>
              <div className="mt-6 space-y-6">
                <div>
                  <label className="mb-2 block text-[11px] font-medium tracking-[0.14em] uppercase text-neutral-500">
                    Gambar Hero
                  </label>
                  <div 
                    className={`relative w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 flex items-center justify-center select-none ${settings.about_hero_ratio === 'min-h-[78vh]' ? 'aspect-video' : settings.about_hero_ratio} ${activeDragId === "hero" ? 'cursor-grabbing' : 'cursor-grab'}`}
                    onPointerDown={(e) => handlePointerDown(e, "hero", settings.about_hero_position)}
                    onPointerMove={(e) => handlePointerMove(e, "hero")}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                  >
                    {settings.about_hero_image ? (
                      <>
                        <Image src={settings.about_hero_image} alt="Hero About" fill className="object-cover pointer-events-none" style={{ objectPosition: settings.about_hero_position }} />
                        <div className="absolute bottom-3 left-3 rounded-md bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm pointer-events-none">
                          Tahan & seret gambar untuk mengatur posisi
                        </div>
                      </>
                    ) : (
                      <span className="text-neutral-400">Tidak ada gambar</span>
                    )}
                  </div>
                  <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-neutral-500">
                          Aspect Ratio
                        </span>
                        <select 
                          value={settings.about_hero_ratio} 
                          onChange={(e) => {
                            setSettings({ ...settings, about_hero_ratio: e.target.value })
                            handleSaveSetting("about_hero_ratio", e.target.value)
                          }}
                          className="mt-1 h-8 w-40 rounded-md border border-neutral-200 px-2 text-sm outline-none bg-white"
                        >
                          {AVAILABLE_RATIOS.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-neutral-500">
                          Fokus (Position)
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm font-mono text-neutral-700 w-16">
                            {settings.about_hero_position}
                          </p>
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="h-8 px-3 text-[10px] rounded-md border-neutral-300"
                            onClick={() => {
                              setSettings(s => ({ ...s, about_hero_position: "50% 50%" }))
                              void handleSaveSetting("about_hero_position", "50% 50%")
                            }}
                          >
                            Reset
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Button disabled={saving} className="relative h-10 w-full sm:w-auto overflow-hidden rounded-xl bg-neutral-900 px-6 text-[11px] tracking-[0.14em] text-white uppercase hover:bg-neutral-800">
                      <input type="file" accept="image/*" className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0" onChange={(e) => handleImageUpload("about_hero_image", e)} disabled={saving} />
                      {saving ? <span className="flex items-center gap-2"><Loader2 className="size-3.5 animate-spin" /> Uploading...</span> : <span className="flex items-center gap-2"><Upload className="size-3.5" /> Ganti Gambar</span>}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-[11px] font-medium tracking-[0.14em] uppercase text-neutral-500">Judul Utama</label>
                    <textarea rows={2} value={settings.about_hero_title} onChange={(e) => setSettings({ ...settings, about_hero_title: e.target.value })} onBlur={() => handleSaveSetting("about_hero_title", settings.about_hero_title)} className="w-full rounded-xl border border-neutral-200 p-3 text-sm outline-none transition focus:border-neutral-900" />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-medium tracking-[0.14em] uppercase text-neutral-500">Teks Deskripsi</label>
                    <textarea rows={4} value={settings.about_hero_text} onChange={(e) => setSettings({ ...settings, about_hero_text: e.target.value })} onBlur={() => handleSaveSetting("about_hero_text", settings.about_hero_text)} className="w-full rounded-xl border border-neutral-200 p-3 text-sm outline-none transition focus:border-neutral-900" />
                  </div>
                </div>
              </div>
            </section>

            {/* 2. BRAND STORY SECTION */}
            <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold tracking-tight">Bagian Brand Story</h2>
              <div className="mt-6 space-y-6">
                <div>
                  <label className="mb-2 block text-[11px] font-medium tracking-[0.14em] uppercase text-neutral-500">Gambar Brand Story</label>
                  <div 
                    className={`relative w-full max-w-sm overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 flex items-center justify-center select-none ${settings.about_story_ratio} ${activeDragId === "story" ? 'cursor-grabbing' : 'cursor-grab'}`}
                    onPointerDown={(e) => handlePointerDown(e, "story", settings.about_story_position)}
                    onPointerMove={(e) => handlePointerMove(e, "story")}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                  >
                    {settings.about_story_image ? (
                      <>
                        <Image src={settings.about_story_image} alt="Story About" fill className="object-cover pointer-events-none" style={{ objectPosition: settings.about_story_position }} />
                        <div className="absolute bottom-3 left-3 rounded-md bg-black/50 px-2 py-1 text-[10px] text-white backdrop-blur-sm pointer-events-none text-center">
                          Seret gambar
                        </div>
                      </>
                    ) : <span className="text-neutral-400">Tidak ada gambar</span>}
                  </div>
                  <div className="mt-4 flex flex-col sm:flex-row items-start justify-between gap-4 max-w-sm">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-neutral-500">
                        Aspect Ratio
                      </span>
                      <select 
                        value={settings.about_story_ratio} 
                        onChange={(e) => {
                          setSettings({ ...settings, about_story_ratio: e.target.value })
                          handleSaveSetting("about_story_ratio", e.target.value)
                        }}
                        className="mt-1 h-8 w-full sm:w-40 rounded-md border border-neutral-200 px-2 text-sm outline-none bg-white"
                      >
                        {AVAILABLE_RATIOS.filter(r => r.value !== "min-h-[78vh]").map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                      <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-neutral-500">
                        Fokus (Position)
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs font-mono text-neutral-700 w-16">
                          {settings.about_story_position}
                        </p>
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="h-8 px-3 text-[10px] rounded-md border-neutral-300"
                          onClick={() => {
                            setSettings(s => ({ ...s, about_story_position: "50% 50%" }))
                            void handleSaveSetting("about_story_position", "50% 50%")
                          }}
                        >
                          Reset
                        </Button>
                      </div>
                    </div>
                    <Button disabled={saving} className="relative h-10 w-full sm:w-auto overflow-hidden rounded-xl bg-neutral-900 px-6 text-[11px] tracking-[0.14em] text-white uppercase hover:bg-neutral-800 mt-6 sm:mt-0">
                      <input type="file" accept="image/*" className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0" onChange={(e) => handleImageUpload("about_story_image", e)} disabled={saving} />
                      {saving ? <span className="flex items-center gap-2"><Loader2 className="size-3.5 animate-spin" /> Uploading...</span> : <span className="flex items-center gap-2"><Upload className="size-3.5" /> Ganti</span>}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-[11px] font-medium tracking-[0.14em] uppercase text-neutral-500">Judul Story</label>
                    <input type="text" value={settings.about_story_title} onChange={(e) => setSettings({ ...settings, about_story_title: e.target.value })} onBlur={() => handleSaveSetting("about_story_title", settings.about_story_title)} className="h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none transition focus:border-neutral-900" />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-medium tracking-[0.14em] uppercase text-neutral-500">Teks Paragraf Story</label>
                    <textarea rows={10} value={settings.about_story_text} onChange={(e) => setSettings({ ...settings, about_story_text: e.target.value })} onBlur={() => handleSaveSetting("about_story_text", settings.about_story_text)} className="w-full rounded-xl border border-neutral-200 p-3 text-sm outline-none transition focus:border-neutral-900" />
                  </div>
                </div>
              </div>
            </section>

            {/* 3. VALUES SECTION */}
            <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold tracking-tight">Values (Nilai Brand)</h2>
                <Button onClick={addValue} disabled={saving} className="h-8 rounded-lg bg-neutral-900 px-3 text-xs text-white hover:bg-neutral-800">
                  <Plus className="mr-1.5 size-3.5" /> Tambah
                </Button>
              </div>
              
              <div className="space-y-4">
                {settings.about_values.map((v, i) => (
                  <div key={v.id} className="relative border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                    <div className="absolute top-4 right-4 flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => moveValue(i, 'up')} disabled={i === 0 || saving} className="h-7 w-7"><ChevronUp className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => moveValue(i, 'down')} disabled={i === settings.about_values.length - 1 || saving} className="h-7 w-7"><ChevronDown className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => removeValue(i)} disabled={saving} className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="size-4" /></Button>
                    </div>
                    <div className="grid gap-4 pr-24">
                      <div>
                        <label className="text-[10px] font-medium tracking-[0.1em] uppercase text-neutral-500">Judul</label>
                        <input type="text" value={v.title} onChange={(e) => updateValue(i, { title: e.target.value })} onBlur={() => handleSaveSetting("about_values", settings.about_values)} className="mt-1 h-8 w-full rounded-md border border-neutral-200 px-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium tracking-[0.1em] uppercase text-neutral-500">Deskripsi</label>
                        <textarea rows={2} value={v.description} onChange={(e) => updateValue(i, { description: e.target.value })} onBlur={() => handleSaveSetting("about_values", settings.about_values)} className="mt-1 w-full rounded-md border border-neutral-200 p-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium tracking-[0.1em] uppercase text-neutral-500">Icon</label>
                        <select value={v.icon} onChange={(e) => { updateValue(i, { icon: e.target.value }); handleSaveSetting("about_values", settings.about_values) }} className="mt-1 h-8 w-full rounded-md border border-neutral-200 px-2 text-sm">
                          {AVAILABLE_ICONS.map(icon => (
                            <option key={icon} value={icon}>{icon}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                {settings.about_values.length === 0 && <p className="text-sm text-neutral-400 italic">Belum ada data.</p>}
              </div>
            </section>

            {/* 4. LOOKBOOK SECTION */}
            <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Lookbook (Galeri)</h2>
                  <p className="text-xs text-neutral-500 mt-1">Layout Grid (3 Kolom) - Sesuaikan Aspect Ratio tiap gambar.</p>
                </div>
                <Button disabled={saving} className="relative h-8 overflow-hidden rounded-lg bg-neutral-900 px-3 text-xs text-white hover:bg-neutral-800">
                  <input type="file" accept="image/*" className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0" onChange={addLookbookImage} disabled={saving} />
                  {saving ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Plus className="size-3.5 mr-1.5" />} Tambah Foto
                </Button>
              </div>
              
              <div className="space-y-4">
                {settings.about_lookbook.map((lb, i) => (
                  <div key={lb.id} className="relative border border-neutral-200 rounded-lg p-4 bg-neutral-50 flex gap-4 items-start">
                    <div 
                      className={`relative w-28 shrink-0 rounded-md overflow-hidden bg-neutral-200 select-none ${lb.ratio && lb.ratio !== 'min-h-[78vh]' ? lb.ratio : 'aspect-square'} ${activeDragId === lb.id ? 'cursor-grabbing' : 'cursor-grab'}`}
                      onPointerDown={(e) => handlePointerDown(e, lb.id, lb.position || "50% 50%")}
                      onPointerMove={(e) => handlePointerMove(e, lb.id)}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerUp}
                    >
                      <Image src={lb.url} alt="lookbook" fill className="object-cover pointer-events-none" style={{ objectPosition: lb.position || "50% 50%" }} />
                      <div className="absolute bottom-1 left-1 right-1 rounded bg-black/50 px-1 py-0.5 text-[8px] text-white backdrop-blur-sm pointer-events-none text-center">
                        Seret gambar
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pr-24 space-y-3">
                      <div>
                        <label className="text-[10px] font-medium tracking-[0.1em] uppercase text-neutral-500">Alt Text (Untuk SEO)</label>
                        <input type="text" value={lb.alt} onChange={(e) => updateLookbook(i, { alt: e.target.value })} onBlur={() => handleSaveSetting("about_lookbook", settings.about_lookbook)} className="mt-1 h-8 w-full rounded-md border border-neutral-200 px-2 text-sm" />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex flex-col gap-1 w-full sm:w-1/2">
                          <label className="text-[10px] font-medium tracking-[0.1em] uppercase text-neutral-500">Aspect Ratio</label>
                          <select 
                            value={lb.ratio || "aspect-auto"} 
                            onChange={(e) => {
                              updateLookbook(i, { ratio: e.target.value })
                              void handleSaveSetting("about_lookbook", settings.about_lookbook)
                            }}
                            className="mt-1 h-8 w-full rounded-md border border-neutral-200 px-2 text-sm outline-none bg-white"
                          >
                            {AVAILABLE_RATIOS.filter(r => r.value !== "min-h-[78vh]").map(r => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1 w-full sm:w-1/2">
                          <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-neutral-500">
                            Fokus: <span className="font-mono text-neutral-700 normal-case">{lb.position || "50% 50%"}</span>
                          </span>
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="h-8 px-2 w-fit text-[10px] rounded border-neutral-300 mt-1"
                            onClick={() => {
                              updateLookbook(i, { position: "50% 50%" })
                              void handleSaveSetting("about_lookbook", settings.about_lookbook)
                            }}
                          >
                            Reset Tengah
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => moveLookbook(i, 'up')} disabled={i === 0 || saving} className="h-7 w-7"><ChevronUp className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => moveLookbook(i, 'down')} disabled={i === settings.about_lookbook.length - 1 || saving} className="h-7 w-7"><ChevronDown className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => removeLookbook(i)} disabled={saving} className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="size-4" /></Button>
                    </div>
                  </div>
                ))}
                {settings.about_lookbook.length === 0 && <p className="text-sm text-neutral-400 italic">Belum ada foto galeri.</p>}
              </div>
            </section>

            {/* 5. TESTIMONIALS SECTION */}
            <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold tracking-tight">Testimonial Pelanggan</h2>
                <Button onClick={addTestimonial} disabled={saving} className="h-8 rounded-lg bg-neutral-900 px-3 text-xs text-white hover:bg-neutral-800">
                  <Plus className="mr-1.5 size-3.5" /> Tambah
                </Button>
              </div>
              
              <div className="space-y-4">
                {settings.about_testimonials.map((t, i) => (
                  <div key={t.id} className="relative border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                    <div className="absolute top-4 right-4 flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => moveTestimonial(i, 'up')} disabled={i === 0 || saving} className="h-7 w-7"><ChevronUp className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => moveTestimonial(i, 'down')} disabled={i === settings.about_testimonials.length - 1 || saving} className="h-7 w-7"><ChevronDown className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => removeTestimonial(i)} disabled={saving} className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="size-4" /></Button>
                    </div>
                    <div className="grid gap-4 pr-24">
                      <div>
                        <label className="text-[10px] font-medium tracking-[0.1em] uppercase text-neutral-500">Kutipan / Ulasan</label>
                        <textarea rows={3} value={t.quote} onChange={(e) => updateTestimonial(i, { quote: e.target.value })} onBlur={() => handleSaveSetting("about_testimonials", settings.about_testimonials)} className="mt-1 w-full rounded-md border border-neutral-200 p-2 text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-medium tracking-[0.1em] uppercase text-neutral-500">Nama</label>
                          <input type="text" value={t.name} onChange={(e) => updateTestimonial(i, { name: e.target.value })} onBlur={() => handleSaveSetting("about_testimonials", settings.about_testimonials)} className="mt-1 h-8 w-full rounded-md border border-neutral-200 px-2 text-sm" />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium tracking-[0.1em] uppercase text-neutral-500">Lokasi</label>
                          <input type="text" value={t.location} onChange={(e) => updateTestimonial(i, { location: e.target.value })} onBlur={() => handleSaveSetting("about_testimonials", settings.about_testimonials)} className="mt-1 h-8 w-full rounded-md border border-neutral-200 px-2 text-sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {settings.about_testimonials.length === 0 && <p className="text-sm text-neutral-400 italic">Belum ada testimonial.</p>}
              </div>
            </section>

          </div>
        )}
      </div>
    </main>
  )
}
