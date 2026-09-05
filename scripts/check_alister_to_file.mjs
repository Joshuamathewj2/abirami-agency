import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fs from 'fs';

async function check() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const res1 = await fetch(`${url}/rest/v1/mattresses?select=id,name,is_active&name=ilike.*Alister*`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  const mattresses = await res1.json();

  let results = { mattresses, variants: [], orderItems: [], inquiryItems: [] };

  if (mattresses && mattresses.length > 0) {
    for (const m of mattresses) {
      const res2 = await fetch(`${url}/rest/v1/variants?select=id,size_name&mattress_id=eq.${m.id}`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` }
      });
      const variants = await res2.json();
      results.variants.push(...(variants || []));

      const varIds = (variants || []).map(v => v.id);
      if (varIds.length > 0) {
        const inClause = varIds.join(',');
        const res3 = await fetch(`${url}/rest/v1/order_items?select=id,order_id,product_name,variant_id&variant_id=in.(${inClause})`, {
          headers: { apikey: key, Authorization: `Bearer ${key}` }
        });
        const oItems = await res3.json();
        results.orderItems.push(...(oItems || []));

        const res4 = await fetch(`${url}/rest/v1/inquiry_items?select=id,inquiry_id,product_name,variant_id&variant_id=in.(${inClause})`, {
          headers: { apikey: key, Authorization: `Bearer ${key}` }
        });
        const iItems = await res4.json();
        results.inquiryItems.push(...(iItems || []));
      }
    }
  }

  fs.writeFileSync('scripts/alister_result.json', JSON.stringify(results, null, 2));
  console.log('DONE_CHECK');
}

check();
