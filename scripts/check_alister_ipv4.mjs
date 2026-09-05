import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import https from 'https';

const host = process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requestApi(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: host,
      path: path,
      method: 'GET',
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      family: 4
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('=== ALISTER FK CHECK ===');
  const mattresses = await requestApi('/rest/v1/mattresses?select=id,name,is_active&name=ilike.*Alister*');
  console.log('Mattresses:', mattresses);

  for (const m of mattresses) {
    const variants = await requestApi(`/rest/v1/variants?select=id,size_name&mattress_id=eq.${m.id}`);
    console.log(`Variants for ${m.name}:`, variants);

    const varIds = variants.map(v => v.id);
    if (varIds.length > 0) {
      const inStr = varIds.join(',');
      const orderItems = await requestApi(`/rest/v1/order_items?select=id,order_id,product_name&variant_id=in.(${inStr})`);
      console.log('Order Items count:', orderItems.length, orderItems);

      const inquiryItems = await requestApi(`/rest/v1/inquiry_items?select=id,inquiry_id,product_name&variant_id=in.(${inStr})`);
      console.log('Inquiry Items count:', inquiryItems.length, inquiryItems);
    }
  }
}

run();
