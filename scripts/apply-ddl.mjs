// Apply schema migration via the service role client that's already configured
// Run: node scripts/apply-ddl.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cozhkqjlpqeapiylksnm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvemhrcWpscHFlYXBpeWxrc25tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTY3MzU5MywiZXhwIjoyMTAxMjQ5NTkzfQ.KjI0_evzuf7-eTjiLUc824sduIpvRnoK5na88zWtew0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('\n🔄 Applying DDL via Supabase service role...\n');

  // The service role client bypasses RLS but can't run DDL directly via REST API.
  // We use the postgres-meta approach: insert into inquiry_items with product_name
  // to trigger a "column does not exist" error IF migration hasn't run,
  // OR we check a metadata table.

  // Best approach for DDL without CLI: use the pg_meta endpoint
  const ddlStatements = [
    `ALTER TABLE public.inquiry_items ADD COLUMN IF NOT EXISTS product_name TEXT`,
    `UPDATE public.inquiries SET status = 'Pending' WHERE status IN ('NEW', 'new')`,
  ];

  // Try via supabase.rpc — requires a function to be pre-created
  // Since we can't run DDL via REST API, test if the column exists via REST
  const { data, error } = await supabase
    .from('inquiry_items')
    .select('id, product_name')
    .limit(1);

  if (error && error.message.includes('product_name')) {
    console.log('❌ product_name column missing — please run the SQL manually in Supabase Dashboard');
    console.log('\n📋 SQL to run in Supabase SQL Editor:');
    console.log('──────────────────────────────────────────────────────────────────');
    for (const stmt of ddlStatements) {
      console.log(stmt + ';');
    }
    console.log('\n-- Enable Realtime:');
    console.log('ALTER PUBLICATION supabase_realtime ADD TABLE public.inquiries;');
    console.log('ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;');
    console.log('\n-- Reload schema cache:');
    console.log("NOTIFY pgrst, 'reload schema';");
    console.log('──────────────────────────────────────────────────────────────────');
    console.log('\nGo to: https://supabase.com/dashboard/project/cozhkqjlpqeapiylksnm/sql/new');
  } else if (!error) {
    console.log('✅ product_name column already exists — no DDL needed');
  } else {
    console.log('Unexpected error:', error);
  }

  // Verify existing data health
  const { data: pending, error: e2 } = await supabase
    .from('inquiries')
    .select('id, status')
    .in('status', ['NEW', 'new']);
  
  if (!e2 && pending) {
    if (pending.length > 0) {
      console.log(`\n⚠️  Found ${pending.length} rows with status=NEW — updating to Pending...`);
      const { error: e3 } = await supabase
        .from('inquiries')
        .update({ status: 'Pending' })
        .in('status', ['NEW', 'new']);
      if (e3) console.log('❌ Update failed:', e3.message);
      else console.log('✅ Updated to Pending');
    } else {
      console.log('✅ No legacy NEW status rows to migrate');
    }
  }
}

main().catch(console.error);
