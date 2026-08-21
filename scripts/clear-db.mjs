import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function clear() {
  console.log('Clearing database...');
  const { error: e0 } = await supabase.from('inquiry_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (e0) console.error('Error clearing inquiry_items:', e0);

  const { error: e0b } = await supabase.from('inquiries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (e0b) console.error('Error clearing inquiries:', e0b);

  const { error: e1 } = await supabase.from('product_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (e1) console.error('Error clearing product_images:', e1);
  
  const { error: e2 } = await supabase.from('variants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (e2) console.error('Error clearing variants:', e2);
  
  const { error: e3 } = await supabase.from('mattresses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (e3) console.error('Error clearing mattresses:', e3);
  
  const { error: e4 } = await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (e4) console.error('Error clearing order_items:', e4);
  
  const { error: e5 } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (e5) console.error('Error clearing orders:', e5);
  
  const { error: e6 } = await supabase.from('coupons').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (e6) console.error('Error clearing coupons:', e6);
  
  console.log('Done!');
}

clear();
