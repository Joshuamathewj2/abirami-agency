import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Apply the migration SQL directly via REST API
async function applyMigration() {
  const sql = `
-- Ensure RLS is on coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;
CREATE POLICY "Public can view active coupons"
  ON public.coupons FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  TO authenticated
  USING  ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

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

NOTIFY pgrst, 'reload schema';
  `;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/rpc/';
  // Use direct SQL via the pg endpoint
  const pgUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', 'https://') + '/rest/v1/';
  
  // Use the management API / direct SQL exec
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  
  if (!response.ok) {
    // Try alternate endpoint
    const response2 = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: { 'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '' }
    });
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text.slice(0, 500));
    
    // If endpoint is unavailable, just report the sql so it can be manually applied
    console.log('\n--- SQL to apply manually in Supabase SQL editor ---\n', sql);
    return;
  }
  
  const data = await response.json();
  console.log('Migration result:', data);
}

applyMigration().catch(console.error);
