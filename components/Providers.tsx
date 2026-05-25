"use client"

import { PageTransition } from "@/components/PageTransition"

type ProvidersProps = {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return <PageTransition>{children}</PageTransition>
}
