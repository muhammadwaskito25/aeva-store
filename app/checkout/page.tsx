import { BrandLogo } from "@/components/BrandLogo"
import { CheckoutForm } from "@/components/CheckoutForm"
import {
  getMidtransSnapScriptUrl,
  isMidtransConfigured,
} from "@/lib/midtrans"

export const dynamic = "force-dynamic"

export default async function CheckoutPage() {
  const midtransEnabled = isMidtransConfigured()

  return (
    <main className="min-h-screen bg-[#f8f5ef] text-neutral-900">
      <header className="sticky top-0 z-40 border-b border-black/10 bg-[#f8f5ef]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <BrandLogo />
          <p className="text-[11px] tracking-[0.14em] uppercase text-neutral-600">
            Secure Checkout
          </p>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[1fr_360px] lg:items-start lg:gap-10">
        <CheckoutForm
          shippingFee={0}
          midtransEnabled={midtransEnabled}
          midtransClientKey={
            midtransEnabled
              ? (process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? null)
              : null
          }
          midtransScriptUrl={getMidtransSnapScriptUrl()}
        />
      </section>
    </main>
  )
}
