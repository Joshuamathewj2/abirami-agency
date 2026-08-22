'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getAllCategoriesAction() {
  try {
    const supabase = await createClient();
    
    // Attempt to query all columns including hero_banner_url and sort_order
    const res = await (supabase.from('materials') as any).select('id, name, hero_banner_url, sort_order');
    
    if (res.error) {
      console.warn('DB error reading category banners/orders. Trying fallback. Error:', res.error.message);
      // Fallback to core columns if columns do not exist
      const fallbackRes = await supabase.from('materials').select('id, name');
      if (fallbackRes.error) throw fallbackRes.error;
      
      const normalizedData = fallbackRes.data?.map(c => ({
        id: c.id,
        name: c.name,
        hero_banner_url: '',
        sort_order: 0
      })) || [];
      
      return { success: true, data: normalizedData, schemaUpdated: false };
    }
    
    const sorted = (res.data || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
    return { success: true, data: sorted, schemaUpdated: true };
  } catch (error: any) {
    console.error('Failed to get categories:', error);
    return { success: false, error: error.message };
  }
}

export async function updateCategoryAction(id: string, name: string, heroBannerUrl: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await (supabase
      .from('materials') as any)
      .update({ name, hero_banner_url: heroBannerUrl })
      .eq('id', id);

    if (error) {
      if (error.message.includes('hero_banner_url') || error.code === '42703') {
        // Fallback: update only name if columns don't exist in DB yet
        const { error: fallbackError } = await supabase
          .from('materials')
          .update({ name })
          .eq('id', id);
        if (fallbackError) throw fallbackError;
        return { 
          success: true, 
          warning: 'Category name updated. Banner URL could not be saved because the columns do not exist in the database yet.' 
        };
      }
      throw error;
    }
    
    revalidatePath('/admin/categories');
    revalidatePath('/products');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update category:', error);
    return { success: false, error: error.message };
  }
}

export async function reorderCategoriesAction(orderedIds: string[]) {
  try {
    const supabase = await createClient();
    
    const updatePromises = orderedIds.map((id, index) => 
      (supabase.from('materials') as any).update({ sort_order: index }).eq('id', id)
    );
    
    const results = await Promise.all(updatePromises);
    
    for (const res of results) {
      if (res.error && (res.error.message.includes('sort_order') || res.error.code === '42703')) {
        return { 
          success: false, 
          error: 'Reordering cannot be saved. The sort_order column does not exist in the database yet. Please run the SQL migration.' 
        };
      } else if (res.error) {
        throw res.error;
      }
    }
    
    revalidatePath('/admin/categories');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to reorder categories:', error);
    return { success: false, error: error.message };
  }
}
