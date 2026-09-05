import { createClient } from '@/lib/supabase/server';
import CategoriesClient from './CategoriesClient';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  try {
    const supabase = await createClient();
    
    const { data: categories, error } = await supabase
      .from('materials')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Failed to fetch categories:', error.message);
    }

    return <CategoriesClient initialCategories={categories || []} />;
  } catch (err: any) {
    console.error('Error rendering CategoriesPage:', err?.message || err);
    return <CategoriesClient initialCategories={[]} />;
  }
}
