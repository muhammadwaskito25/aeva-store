import { BrandLogo } from "@/components/BrandLogo"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/products"
import { fetchFeaturedProducts } from "@/lib/products.repository"

/** Ongkir contoh dalam Rupiah — sesuaikan di sini. */
const shippingFee = 25_000

export default async function CheckoutPage() {
  const products = await fetchFeaturedProducts()
  const orderItems = products.slice(0, 2).map((product) => ({
    title: product.title,
    detail:
      product.colors[0] && product.sizes[0]
        ? `${product.colors[0]} · ${product.sizes[0]}`
        : product.category,
    quantity: 1,
    price: product.price,
  }))

  const subtotal = orderItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  )
  const total = subtotal + shippingFee

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

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[1fr_360px] lg:gap-10">
        <div className="space-y-8">
          <section className="space-y-5 border border-black/10 bg-white p-5 sm:p-6">
            <div className="space-y-1">
              <p className="text-[11px] tracking-[0.14em] uppercase text-neutral-500">
                Step 1
              </p>
              <h1 className="font-heading text-2xl sm:text-3xl">
                Customer Information
              </h1>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-1">
                <span className="text-xs tracking-[0.12em] uppercase text-neutral-600">
                  First Name
                </span>
                <input
                  type="text"
                  placeholder="Aeva"
                  className="h-11 w-full border border-black/15 bg-[#fcfbf8] px-3 text-sm outline-none transition focus:border-black/30"
                />
              </label>

              <label className="space-y-2 sm:col-span-1">
                <span className="text-xs tracking-[0.12em] uppercase text-neutral-600">
                  Last Name
                </span>
                <input
                  type="text"
                  placeholder="Studio"
                  className="h-11 w-full border border-black/15 bg-[#fcfbf8] px-3 text-sm outline-none transition focus:border-black/30"
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-xs tracking-[0.12em] uppercase text-neutral-600">
                  Email
                </span>
                <input
                  type="email"
                  placeholder="hello@aeva.store"
                  className="h-11 w-full border border-black/15 bg-[#fcfbf8] px-3 text-sm outline-none transition focus:border-black/30"
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-xs tracking-[0.12em] uppercase text-neutral-600">
                  Phone
                </span>
                <input
                  type="tel"
                  placeholder="+62 812 0000 0000"
                  className="h-11 w-full border border-black/15 bg-[#fcfbf8] px-3 text-sm outline-none transition focus:border-black/30"
                />
              </label>
            </div>
          </section>

          <section className="space-y-5 border border-black/10 bg-white p-5 sm:p-6">
            <div className="space-y-1">
              <p className="text-[11px] tracking-[0.14em] uppercase text-neutral-500">
                Step 2
              </p>
              <h2 className="font-heading text-2xl sm:text-3xl">
                Shipping Address
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="text-xs tracking-[0.12em] uppercase text-neutral-600">
                  Street Address
                </span>
                <input
                  type="text"
                  placeholder="Jl. Sudirman No. 12"
                  className="h-11 w-full border border-black/15 bg-[#fcfbf8] px-3 text-sm outline-none transition focus:border-black/30"
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-xs tracking-[0.12em] uppercase text-neutral-600">
                  Apartment / Suite
                </span>
                <input
                  type="text"
                  placeholder="Unit, floor, etc. (optional)"
                  className="h-11 w-full border border-black/15 bg-[#fcfbf8] px-3 text-sm outline-none transition focus:border-black/30"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs tracking-[0.12em] uppercase text-neutral-600">
                  City
                </span>
                <input
                  type="text"
                  placeholder="Jakarta"
                  className="h-11 w-full border border-black/15 bg-[#fcfbf8] px-3 text-sm outline-none transition focus:border-black/30"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs tracking-[0.12em] uppercase text-neutral-600">
                  Postal Code
                </span>
                <input
                  type="text"
                  placeholder="10220"
                  className="h-11 w-full border border-black/15 bg-[#fcfbf8] px-3 text-sm outline-none transition focus:border-black/30"
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-xs tracking-[0.12em] uppercase text-neutral-600">
                  Country
                </span>
                <input
                  type="text"
                  placeholder="Indonesia"
                  className="h-11 w-full border border-black/15 bg-[#fcfbf8] px-3 text-sm outline-none transition focus:border-black/30"
                />
              </label>
            </div>
          </section>
        </div>

        <aside className="h-fit space-y-5 border border-black/10 bg-white p-5 sm:p-6 lg:sticky lg:top-24">
          <div className="space-y-1">
            <p className="text-[11px] tracking-[0.14em] uppercase text-neutral-500">
              Order
            </p>
            <h2 className="font-heading text-2xl">Summary</h2>
          </div>

          <div className="space-y-3 border-y border-black/10 py-4">
            {orderItems.length === 0 ? (
              <p className="text-sm text-neutral-600">
                No items in your order yet. Add pieces from the collection.
              </p>
            ) : (
              orderItems.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <div>
                    <p>{item.title}</p>
                    <p className="text-xs text-neutral-600">
                      {item.detail} · Qty {item.quantity}
                    </p>
                  </div>
                  <p>{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-neutral-700">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-neutral-700">
              <span>Shipping</span>
              <span>{formatPrice(shippingFee)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-black/10 pt-3 text-base">
              <span>Total</span>
              <span className="font-medium">{formatPrice(total)}</span>
            </div>
          </div>

          <Button className="h-11 w-full bg-neutral-900 text-[11px] tracking-[0.14em] text-white uppercase hover:bg-neutral-800">
            Complete Checkout
          </Button>
        </aside>
      </section>
    </main>
  )
}
