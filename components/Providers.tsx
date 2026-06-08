"use client"

import { CartProvider } from "@/lib/cart"
import { PageTransition } from "@/components/PageTransition"
import { CartSheet } from "@/components/CartSheet"

type ProvidersProps = {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <CartProvider>
      <PageTransition>{children}</PageTransition>
      <CartSheet />
    </CartProvider>
  )
}
