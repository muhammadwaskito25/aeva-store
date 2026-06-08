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
import { useCart } from "@/lib/cart"

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Collection", href: "/#collection" },
  { label: "About", href: "/about" },
] as const

type NavbarProps = {
  onCartClick?: () => void
}

function NavLink({
  href,
  label,
  onClick,
  className,
  mobileMenu = false,
}: {
  href: string
  label: string
  onClick?: () => void
  className?: string
  mobileMenu?: boolean
}) {
  const reduceMotion = useReducedMotion()

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group relative inline-flex items-center justify-center transition-colors duration-500 ease-out",
        mobileMenu
          ? "min-h-[3rem] py-2 text-sm font-medium tracking-[0.26em] uppercase text-neutral-800 active:text-neutral-950"
          : "py-1 text-[11px] font-medium tracking-[0.2em] uppercase text-neutral-800 hover:text-neutral-950",
        className
      )}
    >
      <span className="relative z-10">{label}</span>
      {!mobileMenu && !reduceMotion ? (
        <motion.span
          aria-hidden
          className="absolute -bottom-0.5 left-0 h-px w-full bg-neutral-900"
          initial={{ scaleX: 0 }}
          whileHover={{ scaleX: 1 }}
          transition={{ duration: 0.5, ease: luxuryEase }}
          style={{ originX: 0 }}
        />
      ) : null}
    </Link>
  )
}

export function Navbar({ onCartClick }: NavbarProps) {
  const { cartCount, openCart } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const reduceMotion = useReducedMotion()
  const { scrollY } = useScroll()
  const headerOpacity = useTransform(scrollY, [0, 40], [0, 1])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
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

  const showSolidHeader = scrolled || mobileOpen || reduceMotion

  return (
    <>
      <motion.header
        className="sticky top-0 z-50 border-b"
        initial={false}
        animate={{
          borderColor: showSolidHeader
            ? "rgba(0, 0, 0, 0.06)"
            : "rgba(0, 0, 0, 0)",
          boxShadow: showSolidHeader
            ? "0 8px 30px -20px rgba(0, 0, 0, 0.1)"
            : "0 0 0 0 rgba(0, 0, 0, 0)",
        }}
        transition={{ duration: 0.6, ease: luxuryEase }}
      >
        {!reduceMotion && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[#f8f5ef]/94 backdrop-blur-md"
            style={{ opacity: mobileOpen ? 1 : headerOpacity }}
          />
        )}
        <div
          className={cn(
            "absolute inset-0 transition-all duration-700 ease-out",
            showSolidHeader
              ? "bg-[#f8f5ef]/94 backdrop-blur-md"
              : "bg-transparent"
          )}
        />

        <nav
          aria-label="Main navigation"
          className="relative mx-auto grid h-16 w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:h-20 sm:px-8 lg:px-10"
        >
          <div className="flex items-center justify-start">
            <motion.button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((open) => !open)}
              whileTap={reduceMotion ? undefined : { scale: 0.94 }}
              transition={transition.fast}
              className="inline-flex h-11 w-11 items-center justify-center text-neutral-800 transition-colors duration-500 ease-out active:text-neutral-950 md:hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mobileOpen ? "close" : "menu"}
                  initial={{ opacity: 0, rotate: -45 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 45 }}
                  transition={{ duration: 0.4, ease: luxuryEase }}
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
            <BrandLogo priority className="h-9 w-auto max-w-[9.5rem] sm:h-10 sm:max-w-[11rem]" />
          </div>

          <div className="flex items-center justify-end">
            <motion.button
              type="button"
              onClick={onCartClick || openCart}
              whileTap={reduceMotion ? undefined : { scale: 0.96 }}
              transition={transition.fast}
              className="group relative inline-flex min-h-11 items-center gap-2 py-1 text-[10px] font-medium tracking-[0.18em] uppercase text-neutral-800 transition-all duration-500 ease-out active:text-neutral-950 sm:gap-2.5 sm:text-[11px] sm:tracking-[0.2em]"
            >
              <span className="relative">Cart</span>
              {!reduceMotion && (
                <motion.span
                  aria-hidden
                  className="absolute -bottom-0.5 left-0 hidden h-px w-full bg-neutral-900 sm:block"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.5, ease: luxuryEase }}
                  style={{ originX: 0 }}
                />
              )}
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={cartCount}
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.85 }}
                  transition={transition.fast}
                  className={cn(
                    "inline-flex min-h-[1.375rem] min-w-[1.375rem] items-center justify-center rounded-full border px-1.5 text-[10px] tabular-nums leading-none transition-all duration-500 ease-out",
                    showSolidHeader
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

      {/* Fullscreen mobile menu */}
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: luxuryEase }}
          >
            <motion.button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-[#f8f5ef]/97 backdrop-blur-xl"
              onClick={() => setMobileOpen(false)}
            />
            <motion.nav
              aria-label="Mobile menu"
              className="relative flex flex-1 flex-col items-center justify-center px-6 pb-24 pt-20"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.55, ease: luxuryEase, delay: 0.05 }}
            >
              <motion.ul
                className="flex w-full max-w-xs flex-col items-center gap-2"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: { staggerChildren: 0.09, delayChildren: 0.08 },
                  },
                }}
              >
                {navLinks.map((link) => (
                  <motion.li
                    key={link.href}
                    className="w-full text-center"
                    variants={{
                      hidden: { opacity: 0, y: 14 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.5, ease: luxuryEase },
                      },
                    }}
                  >
                    <NavLink
                      href={link.href}
                      label={link.label}
                      mobileMenu
                      onClick={() => setMobileOpen(false)}
                      className="w-full"
                    />
                  </motion.li>
                ))}
              </motion.ul>
              <p className="mt-14 text-[10px] tracking-[0.24em] uppercase text-neutral-400">
                AÉVA · Quiet Luxury
              </p>
            </motion.nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
