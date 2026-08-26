import { createClient } from '@/lib/supabase/server';
import CategoriesClient from './CategoriesClient';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const supabase = await createClient();
  
  const { data: categories } = await supabase
    .from('materials')
    .select('*')
    .order('name', { ascending: true });

  return <CategoriesClient initialCategories={categories || []} />;
}
