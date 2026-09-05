import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAlister() {
  console.log('=== FINDING PRODUCT "Alister One Piece WC" ===');
  const { data: mattresses, error: mErr } = await supabaseAdmin
    .from('mattresses')
    .select('id, name, is_active')
    .ilike('name', '%Alister%');

  if (mErr) {
    console.error('Error finding mattress:', mErr.message);
    return;
  }

  console.log('Matching mattresses:', mattresses);

  for (const m of mattresses || []) {
    console.log(`\nProduct ID: ${m.id} Name: "${m.name}"`);
    
    // Find variants for this mattress
    const { data: variants } = await supabaseAdmin
      .from('variants')
      .select('id, size_name')
      .eq('mattress_id', m.id);

    const variantIds = (variants || []).map(v => v.id);
    console.log(`Found ${variantIds.length} variants:`, variantIds);

    if (variantIds.length > 0) {
      // Check order_items
      const { count: orderCount, data: oItems } = await supabaseAdmin
        .from('order_items')
        .select('*', { count: 'exact' })
        .in('variant_id', variantIds);

      console.log(`References in order_items: ${orderCount}`);

      // Check inquiry_items
      const { count: inquiryCount, data: iItems } = await supabaseAdmin
        .from('inquiry_items')
        .select('*', { count: 'exact' })
        .in('variant_id', variantIds);

      console.log(`References in inquiry_items: ${inquiryCount}`);
    }
  }
}

checkAlister();
