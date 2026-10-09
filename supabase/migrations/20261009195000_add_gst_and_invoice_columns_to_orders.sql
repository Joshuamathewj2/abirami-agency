-- Migration: Add GST and invoice columns to public.orders
-- Fixes PostgREST error: "Could not find the 'cgst_amount' column of 'orders' in the schema cache"

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS invoice_type text DEFAULT 'non-gst',
  ADD COLUMN IF NOT EXISTS gst_mode text DEFAULT 'inclusive',
  ADD COLUMN IF NOT EXISTS gst_rate numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS taxable_amount numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cgst_amount numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sgst_amount numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gst_total numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_gst boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_gstin text;

-- Reload PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
