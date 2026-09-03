import https from 'https';

const SUPABASE_HOST = 'cozhkqjlpqeapiylksnm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvemhrcWpscHFlYXBpeWxrc25tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTY3MzU5MywiZXhwIjoyMTAxMjQ5NTkzfQ.KjI0_evzuf7-eTjiLUc824sduIpvRnoK5na88zWtew0';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvemhrcWpscHFlYXBpeWxrc25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NzM1OTMsImV4cCI6MjEwMTI0OTU5M30.i_xxxr3kC5mIPNbPqer6rHomJk65QrYrZW1XkZWDvRY';

function fetchPath(path, key) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: SUPABASE_HOST,
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      },
      family: 4
    }, (res) => {
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
    req.on('error', (err) => resolve({ error: err.message }));
    req.end();
  });
}

async function run() {
  console.log('--- 1. ORDERS TABLE (Service Role / Admin) ---');
  const ordersAdmin = await fetchPath('/rest/v1/orders?select=*&order=created_at.desc&limit=5', SERVICE_ROLE_KEY);
  console.log('Orders Admin Status:', ordersAdmin.status);
  console.log(JSON.stringify(ordersAdmin.data, null, 2));

  console.log('\n--- 2. INQUIRIES TABLE (Service Role / Admin) ---');
  const inqAdmin = await fetchPath('/rest/v1/inquiries?select=*&order=created_at.desc&limit=5', SERVICE_ROLE_KEY);
  console.log('Inquiries Admin Status:', inqAdmin.status);
  console.log(JSON.stringify(inqAdmin.data, null, 2));

  console.log('\n--- 3. ORDERS TABLE (Anon Client / Public RLS Read) ---');
  const ordersAnon = await fetchPath('/rest/v1/orders?select=id,customer_name,status,total_amount,created_at&order=created_at.desc&limit=5', ANON_KEY);
  console.log('Orders Anon Status:', ordersAnon.status);
  console.log(JSON.stringify(ordersAnon.data, null, 2));

  console.log('\n--- 4. INQUIRIES TABLE (Anon Client / Public RLS Read) ---');
  const inqAnon = await fetchPath('/rest/v1/inquiries?select=id,customer_name,status,total_amount,created_at&order=created_at.desc&limit=5', ANON_KEY);
  console.log('Inquiries Anon Status:', inqAnon.status);
  console.log(JSON.stringify(inqAnon.data, null, 2));
}

run().catch(console.error);
