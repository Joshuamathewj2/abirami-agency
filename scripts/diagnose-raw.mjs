const SUPABASE_URL = 'https://cozhkqjlpqeapiylksnm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvemhrcWpscHFlYXBpeWxrc25tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTY3MzU5MywiZXhwIjoyMTAxMjQ5NTkzfQ.KjI0_evzuf7-eTjiLUc824sduIpvRnoK5na88zWtew0';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvemhrcWpscHFlYXBpeWxrc25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NzM1OTMsImV4cCI6MjEwMTI0OTU5M30.i_xxxr3kC5mIPNbPqer6rHomJk65QrYrZW1XkZWDvRY';

async function queryDB(table, key, limit = 5) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&order=created_at.desc&limit=${limit}`;
  const res = await fetch(url, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : null };
}

async function run() {
  console.log('=== 1. ORDERS TABLE (Service Role / Admin) ===');
  const adminOrders = await queryDB('orders', SERVICE_ROLE_KEY, 5);
  console.log('Admin Orders Status:', adminOrders.status);
  console.log('Top Orders:', JSON.stringify(adminOrders.data, null, 2));

  console.log('\n=== 2. INQUIRIES TABLE (Service Role / Admin) ===');
  const adminInquiries = await queryDB('inquiries', SERVICE_ROLE_KEY, 5);
  console.log('Admin Inquiries Status:', adminInquiries.status);
  console.log('Top Inquiries:', JSON.stringify(adminInquiries.data, null, 2));

  console.log('\n=== 3. ORDERS TABLE (Anon / Public Key - RLS Check) ===');
  const anonOrders = await queryDB('orders', ANON_KEY, 5);
  console.log('Anon Orders Status:', anonOrders.status);
  console.log('Anon Orders Count:', Array.isArray(anonOrders.data) ? anonOrders.data.length : 'ERROR');
  console.log('Anon Orders Data:', JSON.stringify(anonOrders.data, null, 2));

  console.log('\n=== 4. INQUIRIES TABLE (Anon / Public Key - RLS Check) ===');
  const anonInquiries = await queryDB('inquiries', ANON_KEY, 5);
  console.log('Anon Inquiries Status:', anonInquiries.status);
  console.log('Anon Inquiries Count:', Array.isArray(anonInquiries.data) ? anonInquiries.data.length : 'ERROR');
  console.log('Anon Inquiries Data:', JSON.stringify(anonInquiries.data, null, 2));
}

run().catch(console.error);
