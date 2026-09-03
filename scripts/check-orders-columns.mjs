import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function inspectOrders() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`;
  const res = await fetch(url, {
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
  const data = await res.json();
  const ordersSchema = data.definitions?.orders || data.components?.schemas?.orders || {};
  console.log('Orders table properties (columns):');
  console.log(Object.keys(ordersSchema.properties || {}));
}

inspectOrders();
