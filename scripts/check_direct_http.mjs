import https from 'https';

const host = 'cozhkqjlpqeapiylksnm.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvemhrcWpscHFlYXBpeWxrc25tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTY3MzU5MywiZXhwIjoyMTAxMjQ5NTkzfQ.KjI0_evzuf7-eTjiLUc824sduIpvRnoK5na88zWtew0';

function requestApi(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: host,
      port: 443,
      path: path,
      method: 'GET',
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      family: 4
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve(data); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('=== CHECKING MATTRESSES ===');
  const mattresses = await requestApi('/rest/v1/mattresses?select=id,name,is_active&name=ilike.*Alister*');
  console.log('Mattresses:', JSON.stringify(mattresses));

  for (const m of (Array.isArray(mattresses) ? mattresses : [])) {
    const variants = await requestApi(`/rest/v1/variants?select=id,size_name&mattress_id=eq.${m.id}`);
    console.log(`Variants for ${m.name}:`, JSON.stringify(variants));

    const varIds = (Array.isArray(variants) ? variants : []).map(v => v.id);
    if (varIds.length > 0) {
      const inStr = varIds.join(',');
      const orderItems = await requestApi(`/rest/v1/order_items?select=id,order_id,product_name,variant_id&variant_id=in.(${inStr})`);
      console.log('Order Items count:', orderItems.length, JSON.stringify(orderItems));

      const inquiryItems = await requestApi(`/rest/v1/inquiry_items?select=id,inquiry_id,product_name,variant_id&variant_id=in.(${inStr})`);
      console.log('Inquiry Items count:', inquiryItems.length, JSON.stringify(inquiryItems));
    }
  }
}

run();
