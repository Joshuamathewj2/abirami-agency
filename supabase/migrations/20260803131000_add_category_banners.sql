-- Add hero_banner_url and sort_order columns to materials table
ALTER TABLE materials ADD COLUMN IF NOT EXISTS hero_banner_url text;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
