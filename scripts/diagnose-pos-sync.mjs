import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cozhkqjlpqeapiylksnm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvemhrcWpscHFlYXBpeWxrc25tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTY3MzU5MywiZXhwIjoyMTAxMjQ5NTkzfQ.KjI0_evzuf7-eTjiLUc824sduIpvRnoK5na88zWtew0';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvemhrcWpscHFlYXBpeWxrc25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NzM1OTMsImV4cCI6MjEwMTI0OTU5M30.i_xxxr3kC5mIPNbPqer6rHomJk65QrYrZW1XkZWDvRY';

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const anonClient = createClient(SUPABASE_URL, ANON_KEY);

async function diagnose() {
  console.log('=== 1. CHECKING MOST RECENT ORDERS (ADMIN CLIENT) ===');
  const { data: orders, error: ordersErr } = await adminClient
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (ordersErr) console.error('Orders fetch error:', ordersErr);
  else console.log('Top 5 Orders:', JSON.stringify(orders, null, 2));

  console.log('\n=== 2. CHECKING MOST RECENT INQUIRIES (ADMIN CLIENT) ===');
  const { data: inquiries, error: inqErr } = await adminClient
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (inqErr) console.error('Inquiries fetch error:', inqErr);
  else console.log('Top 5 Inquiries:', JSON.stringify(inquiries, null, 2));

  console.log('\n=== 3. TESTING ANON / PUBLIC CLIENT READ ACCESS (RLS CHECK) ===');
  const { data: anonOrders, error: anonOrdersErr } = await anonClient
    .from('orders')
    .select('id, customer_name, status, total_amount, created_at')
    .limit(5);

  console.log('Anon client orders result count:', anonOrders?.length, 'Error:', anonOrdersErr);
  if (anonOrders) console.log('Anon Orders sample:', JSON.stringify(anonOrders, null, 2));

  const { data: anonInquiries, error: anonInqErr } = await anonClient
    .from('inquiries')
    .select('id, customer_name, status, total_amount, created_at')
    .limit(5);

  console.log('Anon client inquiries result count:', anonInquiries?.length, 'Error:', anonInqErr);
  if (anonInquiries) console.log('Anon Inquiries sample:', JSON.stringify(anonInquiries, null, 2));
}

diagnose().catch(console.error);
