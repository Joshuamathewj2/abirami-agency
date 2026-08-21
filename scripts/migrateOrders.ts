import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function migrateData() {
  console.log('Fetching old POS orders from inquiries...');
  const { data: oldOrders, error: fetchErr } = await supabaseAdmin
    .from('inquiries')
    .select('*, inquiry_items(*)')
    .eq('status', 'Completed');

  if (fetchErr || !oldOrders) {
    console.error('Fetch error:', fetchErr);
    return;
  }

  console.log(`Found ${oldOrders.length} completed POS orders to migrate.`);

  for (const old of oldOrders) {
    // Check if it already exists
    const { data: existing } = await supabaseAdmin.from('orders').select('id').eq('id', old.id).single();
    if (existing) continue;

    console.log(`Migrating order ${old.id}...`);
    const { error: insertErr } = await supabaseAdmin.from('orders').insert({
      id: old.id, // preserve ID
      customer_name: old.customer_name,
      customer_phone: old.customer_phone,
      notes: old.notes,
      coupon_id: old.coupon_id,
      discount_amount: old.discount_amount,
      total_amount: old.total_amount,
      status: old.status,
      user_id: old.user_id,
      created_at: old.created_at
    });

    if (insertErr) {
      console.error('Error inserting order:', insertErr);
      continue;
    }

    if (old.inquiry_items && old.inquiry_items.length > 0) {
      const itemsToInsert = old.inquiry_items.map((item: any) => ({
        id: item.id, // preserve ID
        order_id: old.id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        created_at: item.created_at
      }));

      const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(itemsToInsert);
      if (itemsErr) console.error('Error inserting items:', itemsErr);
    }
  }

  console.log('Migration complete!');
}

migrateData();
