import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupCategories() {
  console.log('=======================================================');
  console.log(' PARRYWARE CATEGORY CLEANUP SCRIPT');
  console.log('=======================================================\n');

  // 1. Resolve ID for "One Piece WC (S-Trap)"
  const { data: targetCategory, error: targetErr } = await supabase
    .from('materials')
    .select('id, name')
    .eq('name', 'One Piece WC (S-Trap)')
    .single();

  if (targetErr || !targetCategory) {
    console.error('Could not find target category "One Piece WC (S-Trap)":', targetErr?.message);
    process.exit(1);
  }

  // 2. Reassign products from generic "Water Closet" category to "One Piece WC (S-Trap)"
  const { data: genericCategory } = await supabase
    .from('materials')
    .select('id, name')
    .eq('name', 'Water Closet')
    .single();

  if (genericCategory) {
    console.log(`Reassigning products from generic category "${genericCategory.name}" to "${targetCategory.name}"...`);
    const { error: updateErr } = await supabase
      .from('mattresses')
      .update({ material_id: targetCategory.id })
      .eq('material_id', genericCategory.id);

    if (updateErr) {
      console.error('Failed to reassign products:', updateErr.message);
    } else {
      console.log('✓ Successfully reassigned products.');
    }
  }

  // 3. Delete redundant/empty/generic categories
  const categoriesToDelete = [
    'Water Closet',
    'Faucets — Claret Collection',
    'Faucets — Jade Collection'
  ];

  console.log(`\nDeleting redundant categories: ${categoriesToDelete.join(', ')}...`);

  for (const catName of categoriesToDelete) {
    const { error: delErr } = await supabase
      .from('materials')
      .delete()
      .eq('name', catName);

    if (delErr) {
      console.error(`- Failed to delete "${catName}":`, delErr.message);
    } else {
      console.log(`- Deleted "${catName}".`);
    }
  }

  // 4. Verify remaining active categories
  const { data: remaining, error: remErr } = await supabase
    .from('materials')
    .select('id, name')
    .order('name', { ascending: true });

  console.log('\n=======================================================');
  console.log(` CLEANUP COMPLETE: ${remaining?.length || 0} ACTIVE CATEGORIES RETAINED`);
  console.log('=======================================================');
  remaining?.forEach((c, idx) => {
    console.log(`${idx + 1}. ${c.name}`);
  });
}

cleanupCategories();
