// Verify DB state and apply individual DDL statements via Supabase REST API
const SUPABASE_URL = 'https://cozhkqjlpqeapiylksnm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvemhrcWpscHFlYXBpeWxrc25tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTY3MzU5MywiZXhwIjoyMTAxMjQ5NTkzfQ.KjI0_evzuf7-eTjiLUc824sduIpvRnoK5na88zWtew0';

const h = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
};

async function get(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: h });
  return { status: r.status, body: await r.text() };
}

async function main() {
  console.log('\n🔍 Checking current Supabase DB state...\n');

  // 1. Check inquiries table — read some rows
  const inq = await get('inquiries?select=id,status,total_amount&limit=5&order=created_at.desc');
  console.log(`inquiries table (${inq.status}):`, inq.body.substring(0, 400));

  // 2. Check if product_name exists on inquiry_items
  const items = await get('inquiry_items?select=id,product_name&limit=1');
  if (items.status === 200) {
    console.log('\n✅ inquiry_items.product_name column EXISTS');
  } else if (items.body.includes('product_name') && items.body.includes('does not exist')) {
    console.log('\n❌ inquiry_items.product_name column DOES NOT EXIST — migration needed');
  } else {
    console.log('\ninquiry_items check:', items.status, items.body.substring(0, 200));
  }

  // 3. Check if any 'NEW' status rows exist
  const newStatus = await get("inquiries?select=id,status&status=eq.NEW&limit=5");
  const newRows = JSON.parse(newStatus.body || '[]');
  if (Array.isArray(newRows) && newRows.length > 0) {
    console.log(`\n⚠️  Found ${newRows.length} rows with status='NEW' — migration needed`);
  } else {
    console.log('\n✅ No legacy status=NEW rows found (already clean or empty)');
  }

  // 4. Check orders table exists
  const orders = await get('orders?select=id,status&limit=3&order=created_at.desc');
  if (orders.status === 200) {
    console.log('\n✅ orders table accessible:', orders.body.substring(0, 200));
  } else {
    console.log('\n❌ orders table error:', orders.status, orders.body.substring(0, 200));
  }
}

main().catch(console.error);
