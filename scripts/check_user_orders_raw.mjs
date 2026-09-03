import https from 'https';
import fs from 'fs';

const SUPABASE_HOST = 'cozhkqjlpqeapiylksnm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvemhrcWpscHFlYXBpeWxrc25tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTY3MzU5MywiZXhwIjoyMTAxMjQ5NTkzfQ.KjI0_evzuf7-eTjiLUc824sduIpvRnoK5na88zWtew0';

function fetchPath(path) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: SUPABASE_HOST,
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
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
  const inquiries = await fetchPath('/rest/v1/inquiries?select=id,user_id,customer_name,customer_phone,total_amount,created_at&order=created_at.desc&limit=5');
  const profiles = await fetchPath('/rest/v1/profiles?select=id,email,full_name,phone');
  fs.writeFileSync('user_orders_result.json', JSON.stringify({ inquiries, profiles }, null, 2));
}

run();
