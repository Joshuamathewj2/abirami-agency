import { createClient } from '@supabase/supabase-js';
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
  const schema = data.definitions?.mattresses || data.components?.schemas?.mattresses;
  if (schema) {
    console.log('\nMattresses schema properties:');
    console.log(JSON.stringify(schema.properties, null, 2));
  } else {
    console.log('\nMattresses definition not found. Entire data keys:');
    console.log(Object.keys(data));
    if (data.definitions) {
      console.log('Definitions keys:', Object.keys(data.definitions));
    }
  }
}

inspect();
