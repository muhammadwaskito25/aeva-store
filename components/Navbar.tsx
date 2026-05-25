"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion"
import { Menu, X } from "lucide-react"

import { BrandLogo } from "@/components/BrandLogo"
import { luxuryEase, transition } from "@/lib/motion"
import { cn } from "@/lib/utils"

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Collection", href: "/#collection" },
  { label: "About", href: "/about" },
] as const

type NavbarProps = {
  cartCount: number
  onCartClick: () => void
}

function NavLink({
  href,
  label,
  onClick,
  className,
}: {
  href: string
  label: string
  onClick?: () => void
  className?: string
}) {
  const reduceMotion = useReducedMotion()

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group relative inline-flex py-1 text-[11px] font-medium tracking-[0.2em] uppercase text-neutral-800 transition-colors duration-500 ease-out hover:text-neutral-950",
        className
      )}
    >
      <span className="relative z-10">{label}</span>
      {reduceMotion ? null : (
        <motion.span
          aria-hidden
          className="absolute -bottom-0.5 left-0 h-px w-full bg-neutral-900"
          initial={{ scaleX: 0 }}
          whileHover={{ scaleX: 1 }}
          transition={{ duration: 0.5, ease: luxuryEase }}
          style={{ originX: 0 }}
        />
      )}
    </Link>
  )
}

export function Navbar({ cartCount, onCartClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const reduceMotion = useReducedMotion()
  const { scrollY } = useScroll()
  const headerOpacity = useTransform(scrollY, [0, 48], [0, 1])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  return (
    <>
      <motion.header
        className="sticky top-0 z-50 border-b"
        initial={false}
        animate={{
          borderColor: scrolled
            ? "rgba(0, 0, 0, 0.06)"
            : "rgba(0, 0, 0, 0)",
          boxShadow: scrolled
            ? "0 8px 30px -20px rgba(0, 0, 0, 0.12)"
            : "0 0 0 0 rgba(0, 0, 0, 0)",
        }}
        transition={{ duration: 0.65, ease: luxuryEase }}
      >
        {!reduceMotion && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[#f8f5ef]/92 backdrop-blur-md"
            style={{ opacity: headerOpacity }}
          />
        )}
        <div
          className={cn(
            "absolute inset-0 transition-all duration-700 ease-out",
            scrolled || reduceMotion
              ? "bg-[#f8f5ef]/92 backdrop-blur-md"
              : "bg-transparent"
          )}
        />

        <nav
          aria-label="Main navigation"
          className="relative mx-auto grid h-[4.75rem] w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-5 sm:h-20 sm:px-8 lg:px-10"
        >
          <div className="flex items-center justify-start">
            <motion.button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((open) => !open)}
              whileTap={reduceMotion ? undefined : { scale: 0.96 }}
              transition={transition.fast}
              className="inline-flex h-10 w-10 items-center justify-center text-neutral-800 transition-colors duration-500 ease-out hover:text-neutral-950 md:hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mobileOpen ? "close" : "menu"}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={transition.fast}
                  className="inline-flex"
                >
                  {mobileOpen ? (
                    <X className="size-5 stroke-[1.25]" />
                  ) : (
                    <Menu className="size-5 stroke-[1.25]" />
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.button>
            <BrandLogo priority className="hidden md:inline-flex" />
          </div>

          <div className="hidden items-center justify-center gap-10 md:flex lg:gap-14">
            {navLinks.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </div>

          <div className="flex justify-center md:hidden">
            <BrandLogo priority className="scale-95" />
          </div>

          <div className="flex items-center justify-end">
            <motion.button
              type="button"
              onClick={onCartClick}
              whileHover={reduceMotion ? undefined : { opacity: 0.72 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              transition={transition.base}
              className="group relative inline-flex items-center gap-2.5 py-1 text-[11px] font-medium tracking-[0.2em] uppercase text-neutral-800 transition-all duration-500 ease-out hover:text-neutral-950"
            >
              <span className="relative">
                Cart
                {!reduceMotion && (
                  <motion.span
                    aria-hidden
                    className="absolute -bottom-0.5 left-0 h-px w-full bg-neutral-900"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.5, ease: luxuryEase }}
                    style={{ originX: 0 }}
                  />
                )}
              </span>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={cartCount}
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.85 }}
                  transition={transition.fast}
                  className={cn(
                    "inline-flex min-w-[1.375rem] items-center justify-center rounded-full border px-1.5 py-0.5 text-[10px] tabular-nums leading-none transition-all duration-500 ease-out",
                    scrolled
                      ? "border-neutral-900/15 bg-neutral-900 text-[#f8f5ef]"
                      : "border-neutral-900/20 bg-neutral-900/90 text-[#f8f5ef]"
                  )}
                >
                  {cartCount}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {mobileOpen ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: luxuryEase }}
              className="absolute inset-0 bg-neutral-900/15 backdrop-blur-[3px]"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.55, ease: luxuryEase }}
              className="absolute top-[4.75rem] right-0 left-0 border-b border-black/[0.06] bg-[#f8f5ef]/98 px-8 py-10 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.12)] backdrop-blur-lg"
            >
              <motion.ul
                className="flex flex-col gap-8"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
                  },
                }}
              >
                {navLinks.map((link) => (
                  <motion.li
                    key={link.href}
                    variants={{
                      hidden: { opacity: 0, x: -8 },
                      visible: {
                        opacity: 1,
                        x: 0,
                        transition: { duration: 0.5, ease: luxuryEase },
                      },
                    }}
                  >
                    <NavLink
                      href={link.href}
                      label={link.label}
                      onClick={() => setMobileOpen(false)}
                      className="text-sm tracking-[0.22em]"
                    />
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
