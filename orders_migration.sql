-- ============================================================
-- AÉVA Orders Management System — SQL Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. ORDERS TABLE ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.orders (
  -- Primary Identity
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number            text UNIQUE NOT NULL,       -- Human-friendly: AEVA-20260617-0001
  user_id                 uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,

  -- Customer Info (snapshot at checkout)
  customer_name           text NOT NULL,
  customer_email          text NOT NULL,
  customer_note           text,                       -- Optional note from customer

  -- Totals
  subtotal                numeric(12,2) NOT NULL DEFAULT 0,
  shipping_fee            numeric(12,2) NOT NULL DEFAULT 0,
  total                   numeric(12,2) NOT NULL DEFAULT 0,

  -- Status
  payment_status          text NOT NULL DEFAULT 'Pending'
                            CHECK (payment_status IN ('Pending','Paid','Failed','Refunded')),
  order_status            text NOT NULL DEFAULT 'Pending'
                            CHECK (order_status IN ('Pending','Processing','Shipped','Delivered','Cancelled')),

  -- Shipping Address (snapshot at checkout)
  shipping_name           text NOT NULL,
  shipping_phone          text NOT NULL,
  shipping_address        text NOT NULL,
  shipping_city           text NOT NULL,
  shipping_province       text NOT NULL,
  shipping_postal_code    text NOT NULL,

  -- Fulfillment (filled by admin after shipment)
  courier                 text,                       -- e.g. JNE, J&T, SiCepat
  tracking_number         text,                       -- Nomor resi

  -- Midtrans Readiness (all null until Midtrans is integrated)
  midtrans_transaction_id text,
  midtrans_payment_type   text,
  midtrans_metadata       jsonb,

  -- Admin Notes
  notes                   text,                       -- Internal admin notes

  -- Timeline (null until each event occurs)
  paid_at                 timestamptz,
  processing_at           timestamptz,
  shipped_at              timestamptz,
  delivered_at            timestamptz,
  cancelled_at            timestamptz,

  -- Audit
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- ── 2. ORDER ITEMS TABLE ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.order_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,

  -- Product snapshot at checkout time
  product_id      text NOT NULL,
  product_name    text NOT NULL,
  product_image   text NOT NULL DEFAULT '',
  selected_size   text,
  selected_color  text,

  quantity        integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price           numeric(12,2) NOT NULL DEFAULT 0    -- Price per unit at checkout
);

-- ── 3. INDEXES ───────────────────────────────────────────────

-- Fast lookup by user (customer orders list)
CREATE INDEX IF NOT EXISTS orders_user_id_idx
  ON public.orders (user_id, created_at DESC);

-- Fast lookup by order_number
CREATE INDEX IF NOT EXISTS orders_order_number_idx
  ON public.orders (order_number);

-- Fast lookup for admin filters
CREATE INDEX IF NOT EXISTS orders_status_idx
  ON public.orders (order_status, payment_status);

-- Fast items lookup by order
CREATE INDEX IF NOT EXISTS order_items_order_id_idx
  ON public.order_items (order_id);

-- ── 4. AUTO-UPDATE updated_at TRIGGER ────────────────────────

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 5. ROW LEVEL SECURITY (RLS) ──────────────────────────────

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running migration
DROP POLICY IF EXISTS "Customers can read own orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can read own order items" ON public.order_items;

-- ORDERS: Customer can only read their own orders
-- (INSERT and admin UPDATE is handled server-side using Service Role Key)
CREATE POLICY "Customers can read own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ORDER_ITEMS: Customer can only read items belonging to their own orders
CREATE POLICY "Customers can read own order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- ── 6. COMMENTS ──────────────────────────────────────────────

COMMENT ON TABLE public.orders IS
  'Customer orders. INSERT/admin-UPDATE via service role API routes only. RLS restricts customer SELECT to own rows.';

COMMENT ON TABLE public.order_items IS
  'Snapshot of products at checkout time. Linked to orders. Cascades on order delete.';

COMMENT ON COLUMN public.orders.midtrans_transaction_id IS
  'Set by Midtrans webhook. Null until payment integration is active.';

COMMENT ON COLUMN public.orders.midtrans_metadata IS
  'Raw Midtrans notification payload stored for audit/debugging.';

COMMENT ON COLUMN public.orders.paid_at IS
  'Timestamp when payment_status changed to Paid. Set programmatically.';
