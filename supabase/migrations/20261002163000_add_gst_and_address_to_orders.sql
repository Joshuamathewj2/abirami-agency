-- Add GST and address columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_gst BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS taxable_amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cgst_amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS sgst_amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_gstin TEXT;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
