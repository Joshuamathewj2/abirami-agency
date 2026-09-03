import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/materials?select=id,name`;
  const res = await fetch(url, {
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    }
  });
  const data = await res.json();
  console.log('--- ALL CATEGORIES ---');
  console.log(data);
}

check();
