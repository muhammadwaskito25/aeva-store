-- Run this in Supabase Dashboard -> SQL Editor
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default hero image key
INSERT INTO public.site_settings (key, value)
VALUES ('hero_image_url', '')
ON CONFLICT (key) DO NOTHING;

-- Auto-update updated_at trigger for site_settings
DROP TRIGGER IF EXISTS site_settings_updated_at ON public.site_settings;
CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;
CREATE POLICY "Anyone can read site settings"
  ON public.site_settings
  FOR SELECT
  TO public
  USING (true);

-- Allow admin inserts/updates via Service Role
