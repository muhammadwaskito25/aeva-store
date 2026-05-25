import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"

/** Bump when replacing /public/logo.png to bust browser and Next image cache. */
const LOGO_VERSION = "2"
const LOGO_SRC = `/logo.png?v=${LOGO_VERSION}`

type BrandLogoProps = {
  className?: string
  priority?: boolean
}

export function BrandLogo({ className, priority = false }: BrandLogoProps) {
  return (
    <Link
      href="/"
      aria-label="AEVA home"
      className={cn(
        "inline-flex shrink-0 items-center bg-transparent p-0",
        "transition-all duration-500 ease-out hover:opacity-70",
        className
      )}
    >
      <Image
        key={LOGO_SRC}
        src={LOGO_SRC}
        alt="AEVA"
        width={200}
        height={60}
        priority={priority}
        unoptimized
        className="h-10 w-auto max-w-[11rem] object-contain object-center bg-transparent sm:h-12 sm:max-w-[13rem]"
      />
    </Link>
  )
}
