import fs from 'fs';

const SUPABASE_URL = 'https://cozhkqjlpqeapiylksnm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvemhrcWpscHFlYXBpeWxrc25tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTY3MzU5MywiZXhwIjoyMTAxMjQ5NTkzfQ.KjI0_evzuf7-eTjiLUc824sduIpvRnoK5na88zWtew0';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvemhrcWpscHFlYXBpeWxrc25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NzM1OTMsImV4cCI6MjEwMTI0OTU5M30.i_xxxr3kC5mIPNbPqer6rHomJk65QrYrZW1XkZWDvRY';

const headersService = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json'
};

const headersAnon = {
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json'
};

async function runVerification() {
  const results = {};

  try {
    // 1. Service Role Query - Orders (latest 5)
    const resOrders = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc&limit=5`, { headers: headersService });
    results.service_role_orders = {
      status: resOrders.status,
      data: await resOrders.json()
    };

    // 2. Service Role Query - Inquiries (latest 5)
    const resInquiries = await fetch(`${SUPABASE_URL}/rest/v1/inquiries?select=*&order=created_at.desc&limit=5`, { headers: headersService });
    results.service_role_inquiries = {
      status: resInquiries.status,
      data: await resInquiries.json()
    };

    // 3. Anon Client Read - Orders (latest 5)
    const resAnonOrders = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc&limit=5`, { headers: headersAnon });
    results.anon_orders = {
      status: resAnonOrders.status,
      data: await resAnonOrders.json()
    };

    // 4. Anon Client Read - Inquiries (latest 5)
    const resAnonInquiries = await fetch(`${SUPABASE_URL}/rest/v1/inquiries?select=*&order=created_at.desc&limit=5`, { headers: headersAnon });
    results.anon_inquiries = {
      status: resAnonInquiries.status,
      data: await resAnonInquiries.json()
    };

    // 5. Test POS Order Insert via REST payload matching addOrderToDB
    const testPosPayload = {
      customer_name: 'DIAGNOSTIC POS TEST',
      customer_phone: '9876543210',
      notes: 'BILL TYPE: RETAIL\nINVOICE_ID: INV-2026-DIAG01 | CHANNEL: pos',
      total_amount: 5000,
      discount_amount: 0,
      status: 'Completed',
      bill_type: 'retail'
    };

    const resInsert = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: 'POST',
      headers: { ...headersService, 'Prefer': 'return=representation' },
      body: JSON.stringify(testPosPayload)
    });

    results.test_pos_insert = {
      status: resInsert.status,
      data: await resInsert.json()
    };

  } catch (err) {
    results.error = err.stack || err.message;
  }

  fs.writeFileSync('verification_results.json', JSON.stringify(results, null, 2));
  console.log('Verification results written to verification_results.json');
}

runVerification();
