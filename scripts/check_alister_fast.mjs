import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 1. Get Alister mattress
  const res1 = await fetch(`${url}/rest/v1/mattresses?select=id,name,is_active&name=ilike.*Alister*`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  const mattresses = await res1.json();
  console.log('Mattresses found:', JSON.stringify(mattresses, null, 2));

  if (!mattresses || mattresses.length === 0) return;

  for (const m of mattresses) {
    // 2. Get variants
    const res2 = await fetch(`${url}/rest/v1/variants?select=id,size_name&mattress_id=eq.${m.id}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    });
    const variants = await res2.json();
    console.log(`Variants for ${m.name} (${m.id}):`, JSON.stringify(variants, null, 2));

    const varIds = variants.map(v => v.id);
    if (varIds.length > 0) {
      // 3. Check order_items
      const inClause = varIds.join(',');
      const res3 = await fetch(`${url}/rest/v1/order_items?select=id,order_id,product_name&variant_id=in.(${inClause})`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` }
      });
      const orderItems = await res3.json();
      console.log(`Order items referencing variants of ${m.name}:`, JSON.stringify(orderItems, null, 2));

      // 4. Check inquiry_items
      const res4 = await fetch(`${url}/rest/v1/inquiry_items?select=id,inquiry_id,product_name&variant_id=in.(${inClause})`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` }
      });
      const inquiryItems = await res4.json();
      console.log(`Inquiry items referencing variants of ${m.name}:`, JSON.stringify(inquiryItems, null, 2));
    }
  }
}

check();
