import Link from "next/link"

import { cn } from "@/lib/utils"

const footerLinks = [
  { label: "About", href: "/about", external: false },
  { label: "Care Guide", href: "#", external: false },
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
  "group relative inline-flex py-0.5 text-[11px] font-medium tracking-[0.18em] uppercase text-neutral-500",
  "transition-all duration-500 ease-out hover:text-neutral-900 hover:opacity-90"
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
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-16 lg:px-10">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="font-heading text-lg tracking-[0.12em] text-neutral-900 sm:text-xl">
              AÉVA
            </p>
            <p className="max-w-xs text-xs leading-relaxed text-neutral-500">
              Refined modestwear for quiet elegance and timeless silhouettes.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="flex flex-wrap gap-x-8 gap-y-4 md:justify-end"
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

        <div className="mt-12 flex flex-col gap-3 border-t border-black/[0.05] pt-8 sm:flex-row sm:items-center sm:justify-between">
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
