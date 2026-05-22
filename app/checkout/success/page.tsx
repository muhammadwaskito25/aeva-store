import Link from "next/link"

import { BrandLogo } from "@/components/BrandLogo"
import { Button } from "@/components/ui/button"

type SuccessPageProps = {
  searchParams: Promise<{ order_id?: string; status?: string }>
}

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { order_id: orderId, status } = await searchParams
  const isPending = status === "pending"

  return (
    <main className="min-h-screen bg-[#f8f5ef] text-neutral-900">
      <header className="border-b border-black/10 bg-[#f8f5ef]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
          <BrandLogo />
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-16 text-center sm:px-6">
        <p className="text-[11px] tracking-[0.14em] uppercase text-neutral-500">
          {isPending ? "Payment pending" : "Thank you"}
        </p>
        <h1 className="mt-3 font-heading text-3xl">
          {isPending ? "Menunggu pembayaran" : "Pesanan diterima"}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-neutral-700">
          {isPending
            ? "Selesaikan pembayaran sesuai instruksi Midtrans. Status akan diperbarui otomatis."
            : "Terima kasih telah berbelanja di AEVA. Kami akan memproses pesanan Anda segera."}
        </p>
        {orderId ? (
          <p className="mt-6 text-xs tracking-[0.12em] uppercase text-neutral-500">
            Order ID: {orderId}
          </p>
        ) : null}
        <Button asChild className="mt-8 bg-neutral-900 px-8 text-[11px] tracking-[0.14em] text-white uppercase hover:bg-neutral-800">
          <Link href="/">Kembali ke beranda</Link>
        </Button>
      </section>
    </main>
  )
}
