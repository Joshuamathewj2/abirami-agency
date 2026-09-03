import https from 'https';
import fs from 'fs';

const SUPABASE_HOST = 'cozhkqjlpqeapiylksnm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvemhrcWpscHFlYXBpeWxrc25tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTY3MzU5MywiZXhwIjoyMTAxMjQ5NTkzfQ.KjI0_evzuf7-eTjiLUc824sduIpvRnoK5na88zWtew0';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvemhrcWpscHFlYXBpeWxrc25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NzM1OTMsImV4cCI6MjEwMTI0OTU5M30.i_xxxr3kC5mIPNbPqer6rHomJk65QrYrZW1XkZWDvRY';

function makeRequest(path, key, method = 'GET', bodyData = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_HOST,
      port: 443,
      path: path,
      method: method,
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      family: 4 // Force IPv4
    };

    if (bodyData) {
      options.headers['Prefer'] = 'return=representation';
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (bodyData) {
      req.write(JSON.stringify(bodyData));
    }
    req.end();
  });
}

async function main() {
  console.log('Starting verification via native HTTPS IPv4...');
  const results = {};

  try {
    results.orders_service = await makeRequest('/rest/v1/orders?select=*&order=created_at.desc&limit=5', SERVICE_ROLE_KEY);
    results.inquiries_service = await makeRequest('/rest/v1/inquiries?select=*&order=created_at.desc&limit=5', SERVICE_ROLE_KEY);
    results.orders_anon = await makeRequest('/rest/v1/orders?select=*&order=created_at.desc&limit=5', ANON_KEY);
    results.inquiries_anon = await makeRequest('/rest/v1/inquiries?select=*&order=created_at.desc&limit=5', ANON_KEY);

    // Test order insertion simulating POS Billing
    const testPosOrder = {
      customer_name: 'TEST POS ORDER VERIFY',
      customer_phone: '9998887776',
      notes: 'BILL TYPE: RETAIL\nINVOICE_ID: INV-2026-TESTPOS | CHANNEL: pos',
      total_amount: 4500,
      discount_amount: 0,
      status: 'Completed',
      bill_type: 'retail'
    };

    results.test_pos_insert = await makeRequest('/rest/v1/orders', SERVICE_ROLE_KEY, 'POST', testPosOrder);
  } catch (err) {
    results.error = err.message || String(err);
  }

  fs.writeFileSync('verification_results.json', JSON.stringify(results, null, 2));
  console.log('Verification finished. Saved to verification_results.json');
}

main();
