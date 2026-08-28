-- Run this in Supabase Dashboard -> SQL Editor
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS sizes text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS colors text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;
