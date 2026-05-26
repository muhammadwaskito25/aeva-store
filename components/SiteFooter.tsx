import Link from "next/link"

import { cn } from "@/lib/utils"

const footerLinks = [
  { label: "About", href: "/about", external: false },
  {
    label: "Contact",
    href: "mailto:hello@aeva.store",
    external: true,
  },
  {
    label: "Instagram",
    href: "https://instagram.com/aevascarves",
    external: true,
  },
  {
    label: "TikTok",
    href: "https://tiktok.com/@aevascarves",
    external: true,
  },
] as const

const linkClassName = cn(
  "group relative inline-flex min-h-10 items-center justify-center py-1 text-[11px] font-medium tracking-[0.18em] uppercase text-neutral-500",
  "transition-all duration-500 ease-out hover:text-neutral-900 hover:opacity-90 active:opacity-80"
)

function FooterLink({
  label,
  href,
  external,
}: {
  label: string
  href: string
  external: boolean
}) {
  const underline = (
    <span
      aria-hidden
      className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-neutral-900 transition-transform duration-500 ease-out group-hover:scale-x-100"
    />
  )

  if (href.startsWith("mailto:")) {
    return (
      <a href={href} className={linkClassName}>
        {label}
        {underline}
      </a>
    )
  }

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        {label}
        {underline}
      </a>
    )
  }

  return (
    <Link href={href} className={linkClassName}>
      {label}
      {underline}
    </Link>
  )
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-black/[0.06] bg-[#f8f5ef]">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-8 sm:py-16 lg:px-10">
        <div className="flex flex-col items-center gap-10 text-center md:flex-row md:items-end md:justify-between md:text-left">
          <div className="max-w-xs space-y-3">
            <p className="font-heading text-lg tracking-[0.12em] text-neutral-900 sm:text-xl">
              AÉVA
            </p>
            <p className="text-xs leading-relaxed text-neutral-500">
              Refined modestwear for quiet elegance and timeless silhouettes.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:gap-x-8 md:justify-end"
          >
            {footerLinks.map((item) => (
              <FooterLink
                key={item.label}
                label={item.label}
                href={item.href}
                external={item.external}
              />
            ))}
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 border-t border-black/[0.05] pt-8 text-center sm:mt-12 sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-[10px] tracking-[0.16em] uppercase text-neutral-400">
            © {new Date().getFullYear()} AÉVA. All rights reserved.
          </p>
          <p className="text-[10px] tracking-[0.14em] uppercase text-neutral-400">
            Crafted with intention
          </p>
        </div>
      </div>
    </footer>
  )
}
