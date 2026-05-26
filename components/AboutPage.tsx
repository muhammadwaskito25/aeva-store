"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import { Feather, Sparkles, Sun } from "lucide-react"

import { FadeIn } from "@/components/FadeIn"
import { Navbar } from "@/components/Navbar"
import { SiteFooter } from "@/components/SiteFooter"
import { Button } from "@/components/ui/button"
import { fadeUp, luxuryEase, staggerContainer } from "@/lib/motion"
import { cn } from "@/lib/utils"

const values = [
  {
    title: "Timeless Design",
    description:
      "Silhouettes that transcend seasons — restrained, intentional, and made to feel relevant for years.",
    icon: Sparkles,
  },
  {
    title: "Soft Comfort",
    description:
      "Refined fabrics chosen for gentle drape and breathable wear, elevating everyday movement.",
    icon: Feather,
  },
  {
    title: "Everyday Elegance",
    description:
      "Quiet luxury for modern modestwear — polished enough for occasion, effortless for daily life.",
    icon: Sun,
  },
] as const

const lookbookImages = [
  {
    src: "/hero.png",
    alt: "AÉVA editorial — neutral tones",
    className: "md:col-span-7 md:row-span-2",
    aspect: "aspect-[4/5] md:aspect-auto md:min-h-[520px]",
  },
  {
    src: "/products/scarf1.png",
    alt: "Silk drape detail",
    className: "md:col-span-5",
    aspect: "aspect-[5/4]",
  },
  {
    src: "/products/scarf3.png",
    alt: "Soft fold styling",
    className: "md:col-span-5",
    aspect: "aspect-[5/4]",
  },
] as const

const testimonials = [
  {
    quote:
      "AÉVA scarves feel incredibly refined. The fabric is light, graceful, and elevates every outfit.",
    name: "Mina K.",
    location: "Seoul",
  },
  {
    quote:
      "Minimal, elegant, and timeless. This is exactly the quiet luxury look I wanted.",
    name: "Aiko T.",
    location: "Tokyo",
  },
] as const

function EditorialImage({
  src,
  alt,
  className,
  aspect,
  priority = false,
}: {
  src: string
  alt: string
  className?: string
  aspect: string
  priority?: boolean
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
        sizes="(max-width: 768px) 100vw, 50vw"
        className={cn(
          "object-cover transition-all duration-700 ease-out",
          !reduceMotion && "group-hover:scale-[1.03] group-hover:opacity-95"
        )}
      />
    </motion.div>
  )
}

export function AboutPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[#f8f5ef] text-neutral-900">
      <Navbar cartCount={0} onCartClick={() => router.push("/")} />

      {/* SECTION 1 — HERO */}
      <section className="relative min-h-[88vh] overflow-hidden">
        <Image
          src="/about.png"
          alt="AÉVA — quiet elegance editorial"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#f8f5ef]/55 via-[#f8f5ef]/72 to-[#f8f5ef]"
          aria-hidden
        />
        <div className="absolute inset-0 bg-neutral-900/[0.08]" aria-hidden />

        <div className="relative mx-auto flex min-h-[88vh] w-full max-w-6xl flex-col justify-end px-5 pb-20 pt-32 sm:px-8 sm:pb-28 lg:px-10">
          <FadeIn inView={false} className="max-w-3xl space-y-6">
            <p className="text-[11px] font-medium tracking-[0.28em] uppercase text-neutral-600">
              Our Story
            </p>
            <h1 className="font-heading text-[2.75rem] leading-[1.05] tracking-tight text-neutral-900 sm:text-6xl md:text-7xl">
              Crafted for
              <br />
              Quiet Elegance
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-neutral-700 sm:text-lg">
              AÉVA creates refined modestwear designed for modern women who
              value softness, simplicity, and timeless silhouettes.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* SECTION 2 — BRAND STORY */}
      <section className="border-t border-black/[0.05] bg-[#f8f5ef]">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-10">
          <FadeIn className="relative order-2 lg:order-1">
            <div className="relative aspect-[4/5] overflow-hidden bg-[#ebe6dc]">
              <Image
                src="/products/scarf2.png"
                alt="AÉVA scarf — refined neutral palette"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-all duration-700 ease-out hover:scale-[1.02]"
              />
            </div>
            <p className="mt-4 text-[10px] tracking-[0.2em] uppercase text-neutral-500">
              The AÉVA Edit · SS26
            </p>
          </FadeIn>

          <FadeIn delay={0.1} className="order-1 space-y-8 lg:order-2">
            <div className="space-y-3">
              <p className="text-[11px] tracking-[0.24em] uppercase text-neutral-500">
                Philosophy
              </p>
              <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
                An effortless presence
              </h2>
            </div>
            <div className="space-y-5 text-sm leading-[1.85] text-neutral-700 sm:text-base">
              <p>
                AÉVA was born from a simple belief — that scarves should feel
                timeless, effortless, and made for every woman. We wanted to
                create pieces that are easy to wear, soft in presence, and
                naturally elegant without feeling excessive.
              </p>
              <p>
                Through refined fabrics, neutral tones, and thoughtful
                simplicity, each scarf is designed to become a part of everyday
                moments — comfortable, versatile, and quietly beautiful.
              </p>
              <p>Made for every woman, every style, and every season.</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* SECTION 3 — VALUES */}
      <section className="border-y border-black/[0.05] bg-[#fbf9f5]">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
          <FadeIn className="mb-14 max-w-xl space-y-3">
            <p className="text-[11px] tracking-[0.24em] uppercase text-neutral-500">
              What we stand for
            </p>
            <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
              The AÉVA values
            </h2>
          </FadeIn>

          <motion.div
            className="grid gap-6 md:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-48px" }}
          >
            {values.map((item) => (
              <motion.article
                key={item.title}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.55, ease: luxuryEase }}
                className="group border border-black/[0.08] bg-white/60 p-8 transition-all duration-700 ease-out hover:border-black/[0.12] hover:bg-white hover:shadow-[0_20px_50px_-32px_rgba(0,0,0,0.18)]"
              >
                <item.icon
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
            ))}
          </motion.div>
        </div>
      </section>

      {/* SECTION 4 — LOOKBOOK */}
      <section className="bg-[#f8f5ef]">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
          <FadeIn className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <p className="text-[11px] tracking-[0.24em] uppercase text-neutral-500">
                Lookbook
              </p>
              <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
                Lifestyle &amp; form
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-neutral-600">
              An editorial study of drape, light, and neutral composition —
              captured in the spirit of a fashion campaign.
            </p>
          </FadeIn>

          <motion.div
            className="grid gap-4 md:grid-cols-12 md:grid-rows-2"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
          >
            {lookbookImages.map((img, index) => (
              <motion.div key={img.src} variants={fadeUp} className={img.className}>
                <EditorialImage
                  src={img.src}
                  alt={img.alt}
                  aspect={img.aspect}
                  priority={index === 0}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SECTION 5 — CLIENT NOTES */}
      <section className="border-t border-black/[0.05] bg-[#f3ede3]/50">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
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
            {testimonials.map((item) => (
              <motion.blockquote
                key={item.name}
                variants={fadeUp}
                className="border-l border-neutral-900/20 bg-white/40 px-6 py-5 text-left"
              >
                <p className="text-sm leading-relaxed text-neutral-700 italic">
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
        <FadeIn className="mx-auto flex w-full max-w-6xl flex-col items-center px-5 py-24 text-center sm:px-8 sm:py-32 lg:px-10">
          <p className="text-[11px] tracking-[0.28em] uppercase text-neutral-500">
            The Collection
          </p>
          <h2 className="mt-4 font-heading text-3xl tracking-tight sm:text-5xl">
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
