// Script to apply the sync_fixes migration via Supabase REST API
// Run with: node scripts/apply-sync-fixes.mjs

const SUPABASE_URL = 'https://cozhkqjlpqeapiylksnm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvemhrcWpscHFlYXBpeWxrc25tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTY3MzU5MywiZXhwIjoyMTAxMjQ5NTkzfQ.KjI0_evzuf7-eTjiLUc824sduIpvRnoK5na88zWtew0';

// Individual statements — Supabase REST API requires one statement per request
const statements = [
  // 1. Add product_name to inquiry_items
  `ALTER TABLE public.inquiry_items ADD COLUMN IF NOT EXISTS product_name TEXT`,

  // 2. Normalize legacy 'NEW' status in inquiries
  `UPDATE public.inquiries SET status = 'Pending' WHERE status IS NULL OR status = 'NEW' OR status = 'new'`,

  // 3. Admin policy for inquiries
  `DROP POLICY IF EXISTS "Admins can manage inquiries" ON public.inquiries`,
  `CREATE POLICY "Admins can manage inquiries"
    ON public.inquiries FOR ALL
    TO authenticated
    USING  ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
    WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')`,

  // 4. Admin policy for inquiry_items
  `DROP POLICY IF EXISTS "Admins can manage inquiry_items" ON public.inquiry_items`,
  `CREATE POLICY "Admins can manage inquiry_items"
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
    )`,

  // 5. Enable Realtime on inquiries and orders
  `ALTER PUBLICATION supabase_realtime ADD TABLE public.inquiries`,
  `ALTER PUBLICATION supabase_realtime ADD TABLE public.orders`,

  // 6. Reload PostgREST schema cache
  `NOTIFY pgrst, 'reload schema'`,
];

async function runStatement(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    // Use the pg_execute RPC approach via the Supabase SQL editor endpoint
  });
}

// Use the management API SQL endpoint instead
async function executeSQL(sql) {
  // Extract project ref from URL
  const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
  
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return text;
}

// Better approach: use pg directly via the Supabase pg-proxy endpoint
async function runMigration() {
  console.log('Applying sync fixes migration...\n');
  
  for (const stmt of statements) {
    const preview = stmt.trim().split('\n')[0].substring(0, 80);
    process.stdout.write(`  → ${preview}... `);
    
    try {
      await executeSQL(stmt);
      console.log('✅');
    } catch (err) {
      // Some statements like ALTER PUBLICATION may already exist — log but continue
      const msg = err.message || '';
      if (msg.includes('already member') || msg.includes('already exists') || msg.includes('42710') || msg.includes('42P07')) {
        console.log('⚠️  (already exists, skipped)');
      } else {
        console.log(`❌ ${msg}`);
      }
    }
  }
  
  console.log('\nDone.');
}

runMigration().catch(console.error);
