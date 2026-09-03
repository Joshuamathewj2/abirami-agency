-- =============================================================================
-- Migration: Public RLS Read Policies for orders and inquiries
-- Enables client-side fetches and Realtime postgres_changes event streaming
-- =============================================================================

-- Allow public read on orders
DROP POLICY IF EXISTS "Public can view orders" ON public.orders;
CREATE POLICY "Public can view orders"
  ON public.orders FOR SELECT
  USING (true);

-- Allow public read on order_items
DROP POLICY IF EXISTS "Public can view order_items" ON public.order_items;
CREATE POLICY "Public can view order_items"
  ON public.order_items FOR SELECT
  USING (true);

-- Allow public read on inquiries
DROP POLICY IF EXISTS "Public can view inquiries" ON public.inquiries;
CREATE POLICY "Public can view inquiries"
  ON public.inquiries FOR SELECT
  USING (true);

-- Allow public read on inquiry_items
DROP POLICY IF EXISTS "Public can view inquiry_items" ON public.inquiry_items;
CREATE POLICY "Public can view inquiry_items"
  ON public.inquiry_items FOR SELECT
  USING (true);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
