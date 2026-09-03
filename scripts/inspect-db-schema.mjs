import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function inspect() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`;
  const res = await fetch(url, {
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
  const data = await res.json();
  
  console.log('Materials schema definition:');
  console.log(JSON.stringify(data.definitions?.materials || data.components?.schemas?.materials || {}, null, 2));

  console.log('Mattresses schema definition:');
  console.log(JSON.stringify(data.definitions?.mattresses || data.components?.schemas?.mattresses || {}, null, 2));
}

inspect();
