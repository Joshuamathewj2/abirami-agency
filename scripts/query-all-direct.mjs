import https from 'https';
import fs from 'fs';

const SUPABASE_HOST = 'cozhkqjlpqeapiylksnm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvemhrcWpscHFlYXBpeWxrc25tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTY3MzU5MywiZXhwIjoyMTAxMjQ5NTkzfQ.KjI0_evzuf7-eTjiLUc824sduIpvRnoK5na88zWtew0';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvemhrcWpscHFlYXBpeWxrc25tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTY3MzU5MywiZXhwIjoyMTAxMjQ5NTkzfQ.KjI0_evzuf7-eTjiLUc824sduIpvRnoK5na88zWtew0'; // using service role for all queries to ensure data fetching

function fetchJSON(path, key) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: SUPABASE_HOST,
      port: 443,
      path,
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
      family: 4
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout after 5s'));
    });
    req.end();
  });
}

async function run() {
  let log = '';
  const append = (msg) => {
    log += msg + '\n';
    fs.writeFileSync('query_output.txt', log);
  };

  append('=== 1. LATEST 5 ORDERS (SERVICE ROLE) ===');
  try {
    const orders = await fetchJSON('/rest/v1/orders?select=id,customer_name,customer_phone,status,total_amount,notes,created_at&order=created_at.desc&limit=5', SERVICE_ROLE_KEY);
    append(`Status: ${orders.status}`);
    append(JSON.stringify(orders.data, null, 2));
  } catch (e) {
    append(`Orders error: ${e.message}`);
  }

  append('\n=== 2. LATEST 5 INQUIRIES (SERVICE ROLE) ===');
  try {
    const inquiries = await fetchJSON('/rest/v1/inquiries?select=id,customer_name,customer_phone,status,total_amount,notes,created_at&order=created_at.desc&limit=5', SERVICE_ROLE_KEY);
    append(`Status: ${inquiries.status}`);
    append(JSON.stringify(inquiries.data, null, 2));
  } catch (e) {
    append(`Inquiries error: ${e.message}`);
  }

  append('\n=== 3. LATEST 5 ORDERS (ANON KEY / PUBLIC READ RLS CHECK) ===');
  try {
    const anonOrders = await fetchJSON('/rest/v1/orders?select=id,customer_name,status,total_amount,created_at&order=created_at.desc&limit=5', ANON_KEY);
    append(`Status: ${anonOrders.status}`);
    append(JSON.stringify(anonOrders.data, null, 2));
  } catch (e) {
    append(`Anon orders error: ${e.message}`);
  }

  append('\n=== 4. LATEST 5 INQUIRIES (ANON KEY / PUBLIC READ RLS CHECK) ===');
  try {
    const anonInquiries = await fetchJSON('/rest/v1/inquiries?select=id,customer_name,status,total_amount,created_at&order=created_at.desc&limit=5', ANON_KEY);
    append(`Status: ${anonInquiries.status}`);
    append(JSON.stringify(anonInquiries.data, null, 2));
  } catch (e) {
    append(`Anon inquiries error: ${e.message}`);
  }
}

run().catch(err => {
  fs.writeFileSync('query_output.txt', 'Fatal: ' + err.stack);
});
