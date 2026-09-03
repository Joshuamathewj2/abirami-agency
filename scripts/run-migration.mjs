// Apply migration directly via Supabase SQL API (service role bypasses RLS)
// Run: node scripts/run-migration.mjs

const SUPABASE_URL = 'https://cozhkqjlpqeapiylksnm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvemhrcWpscHFlYXBpeWxrc25tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTY3MzU5MywiZXhwIjoyMTAxMjQ5NTkzfQ.KjI0_evzuf7-eTjiLUc824sduIpvRnoK5na88zWtew0';
const PROJECT_REF = 'cozhkqjlpqeapiylksnm';

// Each statement run separately so errors are isolated
const STATEMENTS = [
  {
    label: 'Add product_name to inquiry_items',
    sql: `ALTER TABLE public.inquiry_items ADD COLUMN IF NOT EXISTS product_name TEXT;`
  },
  {
    label: "Normalize 'NEW' status to 'Pending' in inquiries",
    sql: `UPDATE public.inquiries SET status = 'Pending' WHERE status IS NULL OR status = 'NEW' OR status = 'new';`
  },
  {
    label: 'Drop old inquiries admin policy',
    sql: `DROP POLICY IF EXISTS "Admins can manage inquiries" ON public.inquiries;`
  },
  {
    label: 'Create inquiries admin policy',
    sql: `CREATE POLICY "Admins can manage inquiries"
  ON public.inquiries FOR ALL
  TO authenticated
  USING  ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');`
  },
  {
    label: 'Drop old inquiry_items admin policy',
    sql: `DROP POLICY IF EXISTS "Admins can manage inquiry_items" ON public.inquiry_items;`
  },
  {
    label: 'Create inquiry_items admin policy',
    sql: `CREATE POLICY "Admins can manage inquiry_items"
  ON public.inquiry_items FOR ALL
  TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.inquiries WHERE inquiries.id = inquiry_items.inquiry_id AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.inquiries WHERE inquiries.id = inquiry_items.inquiry_id AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'));`
  },
  {
    label: 'Enable Realtime on inquiries',
    sql: `ALTER PUBLICATION supabase_realtime ADD TABLE public.inquiries;`
  },
  {
    label: 'Enable Realtime on orders',
    sql: `ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;`
  },
  {
    label: 'Reload PostgREST schema cache',
    sql: `NOTIFY pgrst, 'reload schema';`
  },
];

async function runSQL(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  
  const body = await res.text();
  if (!res.ok) {
    // Tolerate "already exists" type errors
    if (body.includes('already member') || body.includes('already exists') || body.includes('42710') || body.includes('42P07')) {
      return { ok: true, skipped: true };
    }
    throw new Error(body);
  }
  return { ok: true };
}

async function main() {
  console.log('\n🔄 Applying WhatsApp/Orders/Analytics sync fixes to Supabase...\n');
  let passed = 0, failed = 0;
  
  for (const { label, sql } of STATEMENTS) {
    process.stdout.write(`  ${label}... `);
    try {
      const r = await runSQL(sql);
      if (r.skipped) {
        console.log('⚠️  (already applied)');
      } else {
        console.log('✅');
        passed++;
      }
    } catch (err) {
      console.log(`❌\n     Error: ${err.message.substring(0, 200)}`);
      failed++;
    }
  }
  
  console.log(`\n✅ ${passed} succeeded | ❌ ${failed} failed\n`);
  
  if (failed === 0) {
    console.log('🎉 All sync fixes applied successfully!');
    console.log('   • inquiry_items.product_name column added');
    console.log('   • Old NEW status rows normalized to Pending');
    console.log('   • RLS policies updated for inquiries + inquiry_items');
    console.log('   • Supabase Realtime enabled on inquiries + orders tables');
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
