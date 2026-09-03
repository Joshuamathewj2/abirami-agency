import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWhatsappLogsTable() {
  console.log('--- Checking whatsapp_logs table in Supabase ---');

  const { data, error } = await supabase.from('whatsapp_logs').select('*').limit(1);
  if (error) {
    console.log('whatsapp_logs table error (may not exist yet):', error.message || error);
  } else {
    console.log('whatsapp_logs table exists! Sample data:', data);
  }
}

testWhatsappLogsTable();
