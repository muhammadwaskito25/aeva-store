"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { Feather, Sparkles, Sun, Star, Heart, Leaf, Diamond, Crown, Check, LucideIcon } from "lucide-react"

import { FadeIn } from "@/components/FadeIn"
import { Navbar } from "@/components/Navbar"
import { SiteFooter } from "@/components/SiteFooter"
import { Button } from "@/components/ui/button"
import { fadeUp, luxuryEase, staggerContainer } from "@/lib/motion"
import { cn } from "@/lib/utils"
import type { AboutSettings } from "@/lib/siteSettings"

const ICON_MAP: Record<string, LucideIcon> = {
  "Sparkles": Sparkles,
  "Feather": Feather,
  "Sun": Sun,
  "Star": Star,
  "Heart": Heart,
  "Leaf": Leaf,
  "Diamond": Diamond,
  "Crown": Crown,
  "Check": Check,
}

function EditorialImage({
  src,
  alt,
  className,
  aspect,
  priority = false,
  position = "50% 50%",
}: {
  src: string
  alt: string
  className?: string
  aspect: string
  priority?: boolean
  position?: string
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { scale: 1.01 }}
      transition={{ duration: 0.7, ease: luxuryEase }}
      className={cn(
        "group relative overflow-hidden bg-[#ebe6dc]",
        aspect,
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        style={{ objectPosition: position }}
        className={cn(
          "object-cover transition-all duration-700 ease-out",
          !reduceMotion && "group-hover:scale-[1.03] group-hover:opacity-95"
        )}
      />
    </motion.div>
  )
}

export function AboutPage({ settings }: { settings: AboutSettings }) {

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f8f5ef] text-neutral-900">
      <Navbar />

      {/* SECTION 1 — HERO */}
      {(() => {
        const ratio = settings.about_hero_ratio || 'min-h-[78vh]'
        const isFullBleed = ratio === 'min-h-[78vh]' || ratio === 'aspect-video' || ratio === 'aspect-auto'
        
        if (isFullBleed) {
          return (
            <section className={cn("relative overflow-hidden w-full", ratio === 'min-h-[78vh]' ? 'min-h-[78vh] sm:min-h-[82vh] lg:min-h-[88vh]' : ratio)}>
              <Image
                src={settings.about_hero_image}
                alt="AÉVA — quiet elegance editorial"
                fill
                priority
                style={{ objectPosition: settings.about_hero_position || "50% 50%" }}
                className="object-cover"
                sizes="100vw"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" aria-hidden />

              <div className={cn(
                "relative mx-auto flex w-full flex-col justify-end max-w-6xl",
                ratio === 'min-h-[78vh]' 
                  ? "px-5 pb-14 pt-28 sm:px-8 sm:pb-20 sm:pt-32 lg:pb-24 lg:px-10 min-h-[78vh] sm:min-h-[82vh] lg:min-h-[88vh]" 
                  : "h-full min-h-[50vh] px-5 pb-10 pt-20 sm:px-10 sm:pb-12"
              )}>
                <FadeIn inView={false} className="max-w-3xl space-y-4 sm:space-y-5">
                  <p className="text-[11px] font-medium tracking-[0.3em] text-white/75 uppercase">
                    Brand Story
                  </p>
                  <h1 className="font-heading text-[2.25rem] leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-7xl lg:leading-[1.05] whitespace-pre-wrap">
                    {settings.about_hero_title}
                  </h1>
                  <p className="max-w-lg text-[15px] leading-[1.75] text-white/90 sm:text-base sm:leading-relaxed whitespace-pre-wrap">
                    {settings.about_hero_text}
                  </p>
                </FadeIn>
              </div>
            </section>
          )
        }

        // EDITORIAL SPLIT LAYOUT FOR PORTRAIT/SQUARE
        return (
          <section className="mx-auto w-full max-w-6xl px-5 pt-32 pb-14 sm:px-8 sm:pt-40 sm:pb-20 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-8">
              <FadeIn inView={false} className="order-2 lg:order-1 lg:col-span-5 xl:col-span-6 space-y-6 sm:space-y-8">
                <div className="space-y-4">
                  <p className="text-[11px] font-medium tracking-[0.25em] text-neutral-500 uppercase">
                    Brand Story
                  </p>
                  <h1 className="font-heading text-4xl leading-[1.1] tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl whitespace-pre-wrap">
                    {settings.about_hero_title}
                  </h1>
                </div>
                <p className="max-w-md text-[15px] leading-[1.8] text-neutral-600 sm:text-base whitespace-pre-wrap">
                  {settings.about_hero_text}
                </p>
              </FadeIn>

              <FadeIn delay={0.1} className="order-1 lg:order-2 lg:col-span-7 xl:col-span-6">
                <div className={cn("relative w-full overflow-hidden rounded-2xl bg-neutral-100", ratio)}>
                  <Image
                    src={settings.about_hero_image}
                    alt="AÉVA — quiet elegance editorial"
                    fill
                    priority
                    style={{ objectPosition: settings.about_hero_position || "50% 50%" }}
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </FadeIn>
            </div>
          </section>
        )
      })()}

      {/* SECTION 2 — BRAND STORY */}
      <section className="border-t border-black/[0.05] bg-[#f8f5ef]">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:gap-12 sm:px-8 sm:py-28 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-10">
          <FadeIn className="relative order-2 lg:order-1">
            <div className={`relative overflow-hidden bg-[#ebe6dc] ${settings.about_story_ratio}`}>
              <Image
                src={settings.about_story_image}
                alt="AÉVA creative director portrait"
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                style={{ objectPosition: settings.about_story_position || "50% 50%" }}
                className="object-cover transition-transform duration-[2s] ease-out hover:scale-105"
              />
            </div>
            <p className="mt-4 text-[10px] tracking-[0.2em] uppercase text-neutral-500">
              The AÉVA Edit
            </p>
          </FadeIn>

          <FadeIn delay={0.1} className="order-1 space-y-6 sm:space-y-8 lg:order-2">
            <div className="space-y-2 sm:space-y-3">
              <p className="text-[10px] tracking-[0.22em] uppercase text-neutral-500 sm:text-[11px] sm:tracking-[0.24em]">
                Philosophy &amp; Craft
              </p>
              <h2 className="font-heading text-2xl tracking-tight sm:text-4xl">
                {settings.about_story_title}
              </h2>
            </div>
            <div className="space-y-5 text-sm leading-[1.85] text-neutral-700 sm:text-base whitespace-pre-wrap">
              {settings.about_story_text}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* SECTION 3 — VALUES */}
      <section className="border-y border-black/[0.05] bg-[#fbf9f5]">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-8 sm:py-28 lg:px-10">
          <FadeIn className="mb-10 max-w-xl space-y-2 sm:mb-14 sm:space-y-3">
            <p className="text-[11px] tracking-[0.24em] uppercase text-neutral-500">
              What we stand for
            </p>
            <h2 className="font-heading text-2xl tracking-tight sm:text-4xl">
              Minimal luxury
            </h2>
          </FadeIn>

          <motion.div
            className="grid gap-4 sm:gap-6 md:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-48px" }}
          >
            {settings.about_values?.map((item) => {
              const Icon = ICON_MAP[item.icon] || Sparkles
              return (
                <motion.article
                  key={item.id}
                  variants={fadeUp}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.55, ease: luxuryEase }}
                  className="group border border-black/[0.08] bg-white/60 p-6 transition-all duration-700 ease-out sm:p-8 md:hover:border-black/[0.12] md:hover:bg-white md:hover:shadow-[0_20px_50px_-32px_rgba(0,0,0,0.18)]"
                >
                  <Icon
                    className="mb-6 size-5 stroke-[1.25] text-neutral-700 transition-colors duration-500 ease-out group-hover:text-neutral-900"
                    aria-hidden
                  />
                  <h3 className="font-heading text-xl tracking-tight text-neutral-900">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                    {item.description}
                  </p>
                </motion.article>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* SECTION 4 — LOOKBOOK */}
      <section className="bg-[#f8f5ef]">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-8 sm:py-28 lg:px-10">
          <FadeIn className="mb-8 flex flex-col gap-3 sm:mb-12 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div className="space-y-3">
              <p className="text-[11px] tracking-[0.24em] uppercase text-neutral-500">
                Lookbook
              </p>
              <h2 className="font-heading text-2xl tracking-tight sm:text-4xl">
                Lifestyle &amp; form
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-neutral-600">
              An editorial study of drape, light, and neutral composition —
              captured in the spirit of a fashion campaign.
            </p>
          </FadeIn>

          <motion.div
            className="columns-1 gap-4 sm:columns-2 md:columns-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
          >
            {settings.about_lookbook?.map((img, index) => {
              const aspect = img.ratio || "aspect-square"
              return (
                <motion.div key={img.id} variants={fadeUp} className="break-inside-avoid mb-4 w-full">
                  <EditorialImage
                    src={img.url}
                    alt={img.alt}
                    aspect={aspect}
                    priority={index === 0}
                    position={img.position}
                  />
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* SECTION 5 — CLIENT NOTES */}
      <section className="border-t border-black/[0.05] bg-[#f3ede3]/50">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-8 sm:py-20 lg:px-10">
          <FadeIn className="mb-10 space-y-2 text-center">
            <p className="text-[11px] tracking-[0.24em] uppercase text-neutral-500">
              Client Notes
            </p>
            <h2 className="font-heading text-2xl tracking-tight text-neutral-800 sm:text-3xl">
              Words from our community
            </h2>
          </FadeIn>

          <motion.div
            className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-32px" }}
          >
            {settings.about_testimonials?.map((item) => (
              <motion.blockquote
                key={item.id}
                variants={fadeUp}
                className="border-l border-neutral-900/20 bg-white/40 px-6 py-5 text-left"
              >
                <p className="text-sm leading-relaxed text-neutral-700 italic whitespace-pre-wrap">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <footer className="mt-4 text-[10px] tracking-[0.18em] uppercase text-neutral-500">
                  {item.name} · {item.location}
                </footer>
              </motion.blockquote>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SECTION 6 — CTA */}
      <section className="border-t border-black/[0.05] bg-[#f8f5ef]">
        <FadeIn className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-16 text-center sm:px-8 sm:py-32 lg:px-10">
          <p className="text-[11px] tracking-[0.28em] uppercase text-neutral-500">
            The Collection
          </p>
          <h2 className="mt-4 font-heading text-2xl tracking-tight sm:text-5xl">
            Discover the Collection
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-neutral-600">
            Explore refined scarves and modestwear pieces curated for quiet,
            modern elegance.
          </p>
          <motion.div
            className="mt-10"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.45, ease: luxuryEase }}
          >
            <Button
              asChild
              className="h-12 bg-neutral-900 px-10 text-[11px] tracking-[0.18em] text-white uppercase transition-all duration-500 ease-out hover:bg-neutral-800 hover:opacity-90"
            >
              <Link href="/#collection">Discover the Collection</Link>
            </Button>
          </motion.div>
        </FadeIn>
      </section>

      <SiteFooter />
    </main>
  )
}
