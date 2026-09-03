import https from 'https';
import fs from 'fs';

const SUPABASE_HOST = 'cozhkqjlpqeapiylksnm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvemhrcWpscHFlYXBpeWxrc25tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTY3MzU5MywiZXhwIjoyMTAxMjQ5NTkzfQ.KjI0_evzuf7-eTjiLUc824sduIpvRnoK5na88zWtew0';

function fetchCount(table) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: SUPABASE_HOST,
      port: 443,
      path: `/rest/v1/${table}?select=*`,
      method: 'GET',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'count=exact'
      },
      family: 4
    }, (res) => {
      const range = res.headers['content-range'];
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ table, status: res.statusCode, contentRange: range, totalCount: range ? range.split('/')[1] : null });
      });
    });
    req.on('error', (err) => resolve({ table, error: err.message }));
    req.end();
  });
}

async function run() {
  const orders = await fetchCount('orders');
  const inquiries = await fetchCount('inquiries');
  const result = { orders, inquiries };
  fs.writeFileSync('counts_result.json', JSON.stringify(result, null, 2));
}

run();
