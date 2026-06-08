"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProductImage } from "@/lib/products"

type Props = {
  images: ProductImage[]
  /** Legacy fallback for products with no uploaded images */
  fallbackImage?: string
  alt: string
}

export function ProductGallery({ images, fallbackImage, alt }: Props) {
  // Merge uploaded images with optional legacy fallback
  const allImages: { url: string; id: string }[] =
    images.length > 0
      ? images.map((img) => ({ url: img.url, id: img.id }))
      : fallbackImage
        ? [{ url: fallbackImage, id: "legacy" }]
        : []

  const [activeIndex, setActiveIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const swipeStartX = useRef<number | null>(null)
  const swipeStartY = useRef<number | null>(null)
  const heroRef = useRef<HTMLDivElement>(null)

  // Clamp index so it's always in bounds (e.g. after images are deleted)
  const safeIndex = allImages.length > 0
    ? Math.min(activeIndex, allImages.length - 1)
    : 0

  const goTo = useCallback(
    (index: number) => {
      if (index === activeIndex || isTransitioning) return
      setIsTransitioning(true)
      setActiveIndex(index)
      setTimeout(() => setIsTransitioning(false), 350)
    },
    [activeIndex, isTransitioning]
  )

  const goPrev = useCallback(() => {
    if (activeIndex > 0) goTo(activeIndex - 1)
  }, [activeIndex, goTo])

  const goNext = useCallback(() => {
    if (activeIndex < allImages.length - 1) goTo(activeIndex + 1)
  }, [activeIndex, allImages.length, goTo])

  // Keyboard navigation (left / right arrow)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goPrev()
      if (e.key === "ArrowRight") goNext()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [goPrev, goNext])

  // Pointer / touch swipe handlers
  function handlePointerDown(e: React.PointerEvent) {
    swipeStartX.current = e.clientX
    swipeStartY.current = e.clientY
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (swipeStartX.current === null || swipeStartY.current === null) return
    const dx = e.clientX - swipeStartX.current
    const dy = e.clientY - swipeStartY.current
    swipeStartX.current = null
    swipeStartY.current = null
    // Ignore primarily vertical gestures (page scroll)
    if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx) * 0.8) return
    if (dx < 0) goNext()
    else goPrev()
  }

  // Empty state
  if (allImages.length === 0) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center bg-[#f1ece3]">
        <p className="text-xs tracking-[0.14em] uppercase text-neutral-400">
          No image
        </p>
      </div>
    )
  }

  const hasMultiple = allImages.length > 1

  return (
    <div className="flex flex-col gap-3">
      {/* ── Hero ─────────────────────────────────────── */}
      <div
        ref={heroRef}
        className={cn(
          "group relative aspect-[4/5] w-full overflow-hidden bg-[#f1ece3]",
          "border border-black/8 select-none",
          hasMultiple && "cursor-grab active:cursor-grabbing"
        )}
        onPointerDown={hasMultiple ? handlePointerDown : undefined}
        onPointerUp={hasMultiple ? handlePointerUp : undefined}
        onPointerCancel={() => {
          swipeStartX.current = null
          swipeStartY.current = null
        }}
      >
        {allImages.map((img, i) => (
          <div
            key={img.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-[350ms] ease-out",
              i === safeIndex ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            <Image
              src={img.url}
              alt={i === 0 ? alt : `${alt} — image ${i + 1}`}
              fill
              priority={i === 0}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              draggable={false}
            />
          </div>
        ))}

        {/* Prev / Next arrow buttons (desktop hover) */}
        {hasMultiple && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={goPrev}
              disabled={safeIndex === 0}
              className={cn(
                "absolute left-3 top-1/2 z-10 -translate-y-1/2",
                "flex h-9 w-9 items-center justify-center",
                "bg-[#f8f5ef]/80 backdrop-blur-sm border border-black/8",
                "opacity-0 transition-all duration-300 ease-out",
                "group-hover:opacity-100 hover:bg-[#f8f5ef]",
                "disabled:cursor-not-allowed disabled:opacity-0"
              )}
            >
              <ChevronLeft className="size-4 stroke-[1.5]" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={goNext}
              disabled={safeIndex === allImages.length - 1}
              className={cn(
                "absolute right-3 top-1/2 z-10 -translate-y-1/2",
                "flex h-9 w-9 items-center justify-center",
                "bg-[#f8f5ef]/80 backdrop-blur-sm border border-black/8",
                "opacity-0 transition-all duration-300 ease-out",
                "group-hover:opacity-100 hover:bg-[#f8f5ef]",
                "disabled:cursor-not-allowed disabled:opacity-0"
              )}
            >
              <ChevronRight className="size-4 stroke-[1.5]" />
            </button>
          </>
        )}

        {/* Mobile animated dot indicators */}
        {hasMultiple && (
          <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 flex items-center gap-1.5 md:hidden">
            {allImages.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Image ${i + 1}`}
                onClick={() => goTo(i)}
                className={cn(
                  "h-1 rounded-full transition-all duration-300 ease-out",
                  i === safeIndex
                    ? "w-5 bg-neutral-900"
                    : "w-1 bg-neutral-900/30"
                )}
              />
            ))}
          </div>
        )}

        {/* Mobile image counter badge */}
        {hasMultiple && (
          <div className="absolute right-3 top-3 z-10 rounded-full bg-black/30 px-2.5 py-1 text-[10px] tracking-[0.1em] text-white backdrop-blur-sm md:hidden">
            {safeIndex + 1}/{allImages.length}
          </div>
        )}
      </div>

      {/* ── Thumbnail strip (desktop only) ────────────── */}
      {hasMultiple && (
        <div
          className="hidden gap-2 md:flex"
          role="tablist"
          aria-label="Product image thumbnails"
        >
          {allImages.map((img, i) => (
            <button
              key={img.id}
              type="button"
              role="tab"
              aria-selected={i === safeIndex}
              aria-label={`View image ${i + 1}`}
              onClick={() => goTo(i)}
              className={cn(
                "relative aspect-square w-16 shrink-0 overflow-hidden border bg-[#f1ece3] transition-all duration-300 ease-out",
                i === safeIndex
                  ? "border-neutral-900 opacity-100"
                  : "border-black/8 opacity-55 hover:opacity-80 hover:border-black/20"
              )}
            >
              <Image
                src={img.url}
                alt={`Thumbnail ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
                draggable={false}
              />
              {i === 0 && <span className="sr-only">Cover image</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
