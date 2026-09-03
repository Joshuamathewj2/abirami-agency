-- =============================================================================
-- Migration: WhatsApp Center ↔ Orders ↔ POS Analytics sync fixes
-- 2026-09-02
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Add product_name to inquiry_items (was missing from initial schema)
--    The app code selects this column; without it every product_name is NULL.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.inquiry_items
  ADD COLUMN IF NOT EXISTS product_name TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Normalize legacy status values in inquiries
--    Original schema default was 'NEW'; UI only handles Pending/Contacted/etc.
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.inquiries
  SET status = 'Pending'
  WHERE status IS NULL OR status = 'NEW' OR status = 'new';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Add service-role / anon insert policy for inquiries and inquiry_items
--    The server-side supabaseAdmin client (service role key) bypasses RLS,
--    but explicit policies protect against accidental anon writes and are
--    required when Supabase enforces RLS for service role (project setting).
-- ─────────────────────────────────────────────────────────────────────────────

-- inquiries: admin full access (select already covered by earlier policy)
DROP POLICY IF EXISTS "Admins can manage inquiries" ON public.inquiries;
CREATE POLICY "Admins can manage inquiries"
  ON public.inquiries FOR ALL
  TO authenticated
  USING  ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- inquiry_items: admin full access
DROP POLICY IF EXISTS "Admins can manage inquiry_items" ON public.inquiry_items;
CREATE POLICY "Admins can manage inquiry_items"
  ON public.inquiry_items FOR ALL
  TO authenticated
  USING  (
    EXISTS (
      SELECT 1 FROM public.inquiries
      WHERE inquiries.id = inquiry_items.inquiry_id
      AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inquiries
      WHERE inquiries.id = inquiry_items.inquiry_id
      AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
  );

-- orders: service role already bypasses RLS; add authenticated admin policy
-- (policy already exists from 20260831220000 migration, this is a no-op guard)
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
CREATE POLICY "Admins can manage orders"
  ON public.orders FOR ALL
  TO authenticated
  USING  ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- order_items: same
DROP POLICY IF EXISTS "Admins can manage order_items" ON public.order_items;
CREATE POLICY "Admins can manage order_items"
  ON public.order_items FOR ALL
  TO authenticated
  USING  (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Enable Supabase Realtime on the tables WhatsApp Center needs to watch
--    This allows supabase.channel().on('postgres_changes', ...) to work.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.inquiries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Reload PostgREST schema cache
-- ─────────────────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
