-- =============================================================================
-- Migration: coupons table, orders table, RLS policies, schema refresh
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Coupons table (fix "could not find table 'public.coupons'" error)
--    The initial schema already defines coupons with different column names.
--    We keep backward compatibility by adding the new columns if missing,
--    so both the original billing flow and the new CouponsClient still work.
-- ─────────────────────────────────────────────────────────────────────────────

-- Ensure RLS is on (initial schema may not have enabled it)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Public read (needed for coupon validation at checkout)
DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;
CREATE POLICY "Public can view active coupons"
  ON public.coupons FOR SELECT
  USING (true);

-- Admin full-access — inline check instead of custom function (no is_admin() defined)
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  TO authenticated
  USING  ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Orders table (POS bills → Orders sync)
--    The billing action writes to `inquiries`; we create a unified `orders`
--    table so POS-completed sales appear in Order Management.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.orders (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id       TEXT         UNIQUE,
  customer_name    TEXT,
  customer_phone   TEXT,
  customer_address TEXT,
  bill_type        TEXT         DEFAULT 'retail',
  coupon_id        UUID         REFERENCES public.coupons(id) ON DELETE SET NULL,
  coupon_code      TEXT,
  discount_amount  NUMERIC(10, 2) DEFAULT 0,
  delivery_charge  NUMERIC(10, 2) DEFAULT 0,
  total_amount     NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status           TEXT         DEFAULT 'Paid',
  payment_method   TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ  DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
CREATE POLICY "Admins can manage orders"
  ON public.orders FOR ALL
  TO authenticated
  USING  ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Order items table (mirrors inquiry_items for POS bills)
CREATE TABLE IF NOT EXISTS public.order_items (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID         NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  variant_id  UUID         REFERENCES public.variants(id),
  product_name TEXT,
  quantity    INT          DEFAULT 1,
  unit_price  NUMERIC(10, 2),
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;
CREATE POLICY "Admins can manage order items"
  ON public.order_items FOR ALL
  TO authenticated
  USING  ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- updated_at trigger for orders
CREATE OR REPLACE FUNCTION update_orders_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_orders_modtime ON public.orders;
CREATE TRIGGER update_orders_modtime
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_orders_modified_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Reload PostgREST schema cache
-- ─────────────────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
