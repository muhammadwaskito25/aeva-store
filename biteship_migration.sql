-- ============================================================
-- AÉVA Biteship Integration — SQL Migration
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Tambah kolom Biteship ke tabel orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_service    text,        -- Nama layanan kurir, e.g. "REG", "YES", "BEST"
  ADD COLUMN IF NOT EXISTS origin_area_id      text,        -- Biteship area_id asal pengiriman (dari env)
  ADD COLUMN IF NOT EXISTS destination_area_id text;        -- Biteship area_id tujuan pembeli

-- Komentar
COMMENT ON COLUMN public.orders.shipping_service IS
  'Kode/nama layanan kurir yang dipilih saat checkout, e.g. REG, YES, SiCepat BEST. Diperlukan untuk future Biteship shipment creation.';

COMMENT ON COLUMN public.orders.origin_area_id IS
  'Biteship area_id lokasi asal pengiriman (gudang). Diisi dari env var BITESHIP_ORIGIN_AREA_ID.';

COMMENT ON COLUMN public.orders.destination_area_id IS
  'Biteship area_id lokasi tujuan pembeli. Dipilih saat checkout via autocomplete.';
