-- =============================================================================
-- Migration: Storage bucket setup + schema column additions
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Storage bucket: product-images
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read access for all visitors (view product images)
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Authenticated admin users can upload images
DROP POLICY IF EXISTS "Admin Upload Access" ON storage.objects;
CREATE POLICY "Admin Upload Access"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Authenticated admin users can update/replace images
DROP POLICY IF EXISTS "Admin Update Access" ON storage.objects;
CREATE POLICY "Admin Update Access"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Authenticated admin users can delete images
DROP POLICY IF EXISTS "Admin Delete Access" ON storage.objects;
CREATE POLICY "Admin Delete Access"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Mattresses table – add missing columns that the form submits
-- ─────────────────────────────────────────────────────────────────────────────

-- is_active already exists in initial schema; guard with IF NOT EXISTS anyway
ALTER TABLE public.mattresses
  ADD COLUMN IF NOT EXISTS material_id     UUID     REFERENCES public.materials(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS is_active       BOOLEAN  DEFAULT true,
  ADD COLUMN IF NOT EXISTS stock_count     INT      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS specifications  JSONB    DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS catalog_page    TEXT,
  ADD COLUMN IF NOT EXISTS capacity        TEXT;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Variants table – add original_price if missing (used by the form)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.variants
  ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Reload PostgREST schema cache
-- ─────────────────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';

