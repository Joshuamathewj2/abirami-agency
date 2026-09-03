import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditCategories() {
  console.log('Fetching all categories from public.materials...\n');

  const { data: materials, error } = await supabase
    .from('materials')
    .select('id, name, created_at')
    .order('name', { ascending: true });

  if (error || !materials) {
    console.error('Error fetching materials:', error?.message);
    process.exit(1);
  }

  console.log(`TOTAL CATEGORIES IN DATABASE: ${materials.length}\n`);

  for (let i = 0; i < materials.length; i++) {
    const mat = materials[i];
    const { count } = await supabase
      .from('mattresses')
      .select('id', { count: 'exact', head: true })
      .eq('material_id', mat.id);

    console.log(`${i + 1}. [ID: ${mat.id}] "${mat.name}" (Linked Products: ${count || 0})`);
  }
}

auditCategories();
