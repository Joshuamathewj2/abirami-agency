import https from 'https';

const SUPABASE_HOST = 'cozhkqjlpqeapiylksnm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvemhrcWpscHFlYXBpeWxrc25tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTY3MzU5MywiZXhwIjoyMTAxMjQ5NTkzfQ.KjI0_evzuf7-eTjiLUc824sduIpvRnoK5na88zWtew0';

function fetchAPI(path, method = 'GET', bodyData = null) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: SUPABASE_HOST,
      port: 443,
      path: path,
      method: method,
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        ...(bodyData ? { 'Prefer': 'return=representation' } : {})
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
    if (bodyData) req.write(JSON.stringify(bodyData));
    req.end();
  });
}

async function run() {
  console.log('=== 1. FINDING JOSHUA PROFILE ===');
  const profileRes = await fetchAPI('/rest/v1/profiles?email=eq.joshuamathewj2@gmail.com');
  const joshuaUser = profileRes.data?.[0];
  console.log('Joshua Profile:', joshuaUser);

  if (!joshuaUser) return;

  console.log('\n=== 2. LINKING PAST JOSHUA UNLINKED INQUIRIES TO HIS USER_ID ===');
  const patchRes = await fetchAPI(`/rest/v1/inquiries?customer_name=ilike.*joshua*`, 'PATCH', {
    user_id: joshuaUser.id
  });
  console.log('Patch response:', patchRes.status);

  console.log('\n=== 3. QUERYING INQUIRIES FOR JOSHUA (user_id = eq.' + joshuaUser.id + ') ===');
  const history = await fetchAPI(`/rest/v1/inquiries?select=id,user_id,customer_name,total_amount,status,created_at&user_id=eq.${joshuaUser.id}&order=created_at.desc`);
  console.log(`Found ${history.data?.length} order(s) for Joshua:`);
  console.log(JSON.stringify(history.data, null, 2));
}

run();
