-- ==============================================================================
-- SAFE & OPTIONAL MIGRATION: Nullify Zero/Invalid Dimensions in Variants
-- Abirami Agency - Parryware Sanitaryware
--
-- PURPOSE:
-- Many fittings, trims, spare parts, and accessories were populated with
-- length = 0, width = 0, height = 0. This migration sets invalid 0 dimensions
-- to NULL so that non-dimensional products do not carry misleading 0" x 0" values.
--
-- NOTE:
-- This script is non-destructive to prices, stock, SKUs, and names.
-- It only updates length, width, and height columns where any of them is <= 0 or empty.
-- ==============================================================================

-- 1. Create a temporary backup table before updating (safety check)
CREATE TABLE IF NOT EXISTS public._backup_variants_dimensions_20261015 AS
SELECT id, sku, size_name, length, width, height
FROM public.variants
WHERE length <= 0 OR width <= 0 OR height <= 0
   OR length IS NULL OR width IS NULL OR height IS NULL;

-- 2. Safely set 0 dimensions to NULL for all variants where dimensions are not full 3D physical sizes
UPDATE public.variants
SET
  length = NULL,
  width = NULL,
  height = NULL
WHERE
  (length <= 0 OR length IS NULL)
  OR (width <= 0 OR width IS NULL)
  OR (height <= 0 OR height IS NULL);

-- 3. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';

-- Verification query (run after migration):
-- SELECT count(*) FROM public.variants WHERE length = 0 OR width = 0 OR height = 0;
