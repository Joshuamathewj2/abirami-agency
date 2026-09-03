import https from 'https';

const SUPABASE_HOST = 'cozhkqjlpqeapiylksnm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvemhrcWpscHFlYXBpeWxrc25tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTY3MzU5MywiZXhwIjoyMTAxMjQ5NTkzfQ.KjI0_evzuf7-eTjiLUc824sduIpvRnoK5na88zWtew0';

function fetchAPI(path) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: SUPABASE_HOST,
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
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
  console.log('=== 1. TOP 5 INQUIRIES RAW ROWS ===');
  const inquiries = await fetchAPI('/rest/v1/inquiries?select=id,user_id,customer_name,total_amount,created_at&order=created_at.desc&limit=5');
  console.log(JSON.stringify(inquiries.data, null, 2));

  console.log('\n=== 2. PROFILES TABLE FOR JOSHUA / JOSHUAMATHEWJ2 ===');
  const profiles = await fetchAPI('/rest/v1/profiles?select=id,email,full_name');
  console.log(JSON.stringify(profiles.data, null, 2));
}

run();
