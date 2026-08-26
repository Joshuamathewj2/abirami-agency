'use server';

import { revalidatePath } from 'next/cache';
import { addProductToDB, deleteProductFromDB } from '@/lib/db';
import { Product } from '@/types';

import { createClient } from '@/lib/supabase/server';

export async function createProductAction(formData: FormData, oldVariants?: any[]) {
  const supabase = await createClient();
  
  const name = formData.get('name') as string;
  const category = formData.get('category') as string;
  const description = formData.get('description') as string;
  const primaryImageIndex = parseInt(formData.get('primaryImageIndex') as string || '0');
  
  // New Parryware Fields
  const subCategory = formData.get('subCategory') as string || '';
  const sku = formData.get('sku') as string || '';
  const basePrice = Number(formData.get('base_price')) || 0;
  const colorPrice = Number(formData.get('color_price')) || basePrice;
  const selectedColorsJson = formData.get('selectedColors') as string;
  const selectedColors = selectedColorsJson ? JSON.parse(selectedColorsJson) : [];
  
  const capacity = formData.get('capacity') as string || '';
  const dimensions = formData.get('dimensions') as string || '';
  const catalogPage = formData.get('catalog_page') as string || '';

  const specifications: Record<string, string> = {};
  if (capacity) specifications['Capacity'] = capacity;
  if (dimensions) specifications['Dimensions'] = dimensions;
  if (catalogPage) specifications['Catalog Page Reference'] = catalogPage;
  if (sku) specifications['Model / SKU Number'] = sku;

  const descriptionJsonObj = {
    description: description,
    subCategory: subCategory,
    colorVariants: selectedColors,
    specifications: specifications
  };

  const serializedDescription = JSON.stringify(descriptionJsonObj);
  const files = formData.getAll('images') as File[];

  // 1. Upload Images to Supabase Storage
  const uploadedUrls: { url: string, isPrimary: boolean }[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);
        
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
          
        uploadedUrls.push({ url: publicUrl, isPrimary: i === primaryImageIndex });
      } else {
        console.error('Failed to upload image:', uploadError);
      }
    }
  }

  // Fallback if no images
  if (uploadedUrls.length === 0) {
    uploadedUrls.push({ url: 'https://placehold.co/800x600/0091FF/white?text=No+Image', isPrimary: true });
  }

  // 2. Insert into materials (get or create category)
  let { data: material } = await supabase.from('materials').select('id').eq('name', category).single();
  if (!material) {
    const { data: newMat, error: matError } = await supabase.from('materials').insert({ name: category }).select('id').single();
    if (matError) throw new Error(`Material Insert Error: ${matError.message} (Check RLS Policies)`);
    material = newMat;
  }

  if (!material) throw new Error('Could not resolve material category');

  // 3. Insert into mattresses
  const { data: mattress, error: mattressError } = await supabase
    .from('mattresses')
    .insert({
      name,
      description: serializedDescription,
      material_id: material.id,
      is_active: true
    })
    .select('id')
    .single();

  if (mattressError || !mattress) throw new Error('Failed to create product record');

  // 4. Insert into product_images
  const imageInserts = uploadedUrls.map((img, idx) => ({
    mattress_id: mattress.id,
    image_url: img.url,
    is_primary: img.isPrimary,
    sort_order: idx
  }));
  await supabase.from('product_images').insert(imageInserts);

  // 5. Generate and Insert a single primary variant
  const dimParts = dimensions.toLowerCase().replace(/mm/g, '').split('x').map(p => parseInt(p.trim()) || 0);
  const length = dimParts[0] || 0;
  const width = dimParts[1] || 0;
  const height = dimParts[2] || 0;

  const mrpPrice = colorPrice || basePrice; // use colorPrice field as MRP (re-purposed field)
  const variantSku = sku || `PAR-${Date.now().toString(36).toUpperCase()}`;
  
  await supabase.from('variants').insert([{
    mattress_id: mattress.id,
    size_name: sku || 'Standard',
    length,
    width,
    height,
    price: basePrice,
    original_price: mrpPrice,
    stock: 10,
    sku: variantSku
  }]);


  revalidatePath('/admin/products');
  revalidatePath('/products');
}

export async function deleteProductAction(productId: string) {
  // Validate UUID format before sending to Supabase
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(productId)) {
    throw new Error('Invalid product ID format. Cannot delete non-database products.');
  }

  const supabase = await createClient();
  
  // Delete related records first to avoid foreign key constraints
  await supabase.from('product_images').delete().eq('mattress_id', productId);
  await supabase.from('variants').delete().eq('mattress_id', productId);
  
  // Delete the mattress
  const { error } = await supabase.from('mattresses').delete().eq('id', productId);
  
  if (error) {
    throw new Error('Failed to delete product: ' + error.message);
  }

  revalidatePath('/admin/products');
  revalidatePath('/products');
}

export async function toggleVariantStockAction(productId: string, variantId: string, inStock: boolean) {
  const supabase = await createClient();
  const newStock = inStock ? 0 : 10;
  await supabase.from('variants').update({ stock: newStock }).eq('id', variantId);
  revalidatePath('/admin/products');
  revalidatePath('/products');
}

export async function updateVariantPriceAction(productId: string, variantId: string, newPrice: number, newMrp?: number) {
  const supabase = await createClient();
  await supabase.from('variants').update({ 
    price: newPrice,
    original_price: newMrp 
  }).eq('id', variantId);
  revalidatePath('/admin/products');
  revalidatePath('/products');
}

export async function addVariantAction(productId: string, variantData: { label: string, dimension: string, price: number, mrp?: number }) {
  const supabase = await createClient();
  
  // Parse dimensions like "72x30" or "72x30x6"
  const parts = variantData.dimension.toLowerCase().split('x');
  const length = parseInt(parts[0]) || 72;
  const width = parseInt(parts[1]) || 30;
  const height = parseInt(parts[2]) || 6;
  
  await supabase.from('variants').insert({
    mattress_id: productId,
    size_name: variantData.label,
    length,
    width,
    height,
    price: variantData.price,
    original_price: variantData.mrp || (variantData.price + 12),
    stock: 10,
    sku: `VAR-${Math.random().toString(36).substring(7).toUpperCase()}`
  });
  
  revalidatePath('/admin/products');
  revalidatePath('/products');
}

export async function deleteVariantAction(variantId: string) {
  const supabase = await createClient();
  await supabase.from('variants').delete().eq('id', variantId);
  revalidatePath('/admin/products');
  revalidatePath('/products');
}

export async function updateProductAction(productId: string, formData: FormData) {
  const supabase = await createClient();
  
  const name = formData.get('name') as string;
  const category = formData.get('category') as string;
  const description = formData.get('description') as string;
  const primaryImageIndex = parseInt(formData.get('primaryImageIndex') as string || '0');
  
  // New Parryware Fields
  const subCategory = formData.get('subCategory') as string || '';
  const sku = formData.get('sku') as string || '';
  const basePrice = Number(formData.get('base_price')) || 0;
  const colorPrice = Number(formData.get('color_price')) || basePrice;
  const selectedColorsJson = formData.get('selectedColors') as string;
  const selectedColors = selectedColorsJson ? JSON.parse(selectedColorsJson) : [];
  
  const capacity = formData.get('capacity') as string || '';
  const dimensions = formData.get('dimensions') as string || '';
  const catalogPage = formData.get('catalog_page') as string || '';

  const specifications: Record<string, string> = {};
  if (capacity) specifications['Capacity'] = capacity;
  if (dimensions) specifications['Dimensions'] = dimensions;
  if (catalogPage) specifications['Catalog Page Reference'] = catalogPage;
  if (sku) specifications['Model / SKU Number'] = sku;

  const descriptionJsonObj = {
    description: description,
    subCategory: subCategory,
    colorVariants: selectedColors,
    specifications: specifications
  };

  const serializedDescription = JSON.stringify(descriptionJsonObj);

  const existingImagesJson = formData.get('existingImages') as string;
  const existingImages = existingImagesJson ? JSON.parse(existingImagesJson) : [];
  const files = formData.getAll('images') as File[];

  // 1. Upload new images
  const uploadedUrls: { url: string, isPrimary: boolean }[] = [];
  
  // First, add existing images that were kept
  existingImages.forEach((img: any, idx: number) => {
    uploadedUrls.push({ url: img.url, isPrimary: idx === primaryImageIndex });
  });

  // Then upload new files
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);
        
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
          
        uploadedUrls.push({ url: publicUrl, isPrimary: (existingImages.length + i) === primaryImageIndex });
      }
    }
  }

  // 2. Update or get category
  let { data: material } = await supabase.from('materials').select('id').eq('name', category).single();
  if (!material) {
    const { data: newMat } = await supabase.from('materials').insert({ name: category }).select('id').single();
    material = newMat;
  }

  // 3. Update mattress
  await supabase
    .from('mattresses')
    .update({
      name,
      description: serializedDescription,
      material_id: material?.id
    })
    .eq('id', productId);

  // 4. Update images
  // Delete old images
  await supabase.from('product_images').delete().eq('mattress_id', productId);
  
  // Insert current images
  if (uploadedUrls.length > 0) {
    const imageInserts = uploadedUrls.map((img, idx) => ({
      mattress_id: productId,
      image_url: img.url,
      is_primary: img.isPrimary,
      sort_order: idx
    }));
    await supabase.from('product_images').insert(imageInserts);
  }

  // 5. Update variants gracefully (handling foreign key constraints)
  const dimParts = dimensions.toLowerCase().replace(/mm/g, '').split('x').map(p => parseInt(p.trim()) || 0);
  const length = dimParts[0] || 0;
  const width = dimParts[1] || 0;
  const height = dimParts[2] || 0;

  const { data: existingVars } = await supabase.from('variants').select('id, size_name').eq('mattress_id', productId);
  const existingVarsMap = new Map(existingVars?.map(v => [v.size_name, v.id]) || []);

  const newColors = ['Standard White', ...selectedColors];
  const varsToInsert: any[] = [];
  const varsToUpdate: any[] = [];

  newColors.forEach((colorName) => {
    const isBase = colorName === 'Standard White';
    const price = isBase ? basePrice : colorPrice;
    const cleanColorId = colorName.toUpperCase().replace(/\s+/g, '');
    const variantSku = sku ? (isBase ? `${sku}-WHITE` : `${sku}-${cleanColorId}`) : `VAR-${Math.random().toString(36).substring(7).toUpperCase()}`;

    const existingId = existingVarsMap.get(colorName);
    if (existingId) {
      varsToUpdate.push({
        id: existingId,
        price,
        original_price: price,
        sku: variantSku,
        length,
        width,
        height
      });
      existingVarsMap.delete(colorName);
    } else {
      varsToInsert.push({
        mattress_id: productId,
        size_name: colorName,
        length,
        width,
        height,
        price,
        original_price: price,
        stock: 10,
        sku: variantSku
      });
    }
  });

  if (varsToInsert.length > 0) {
    await supabase.from('variants').insert(varsToInsert);
  }

  for (const v of varsToUpdate) {
    const { id, ...updates } = v;
    await supabase.from('variants').update(updates).eq('id', id);
  }

  for (const [leftoverName, leftoverId] of existingVarsMap.entries()) {
    const { error: delError } = await supabase.from('variants').delete().eq('id', leftoverId);
    if (delError) {
      await supabase.from('variants').update({ stock: 0 }).eq('id', leftoverId);
    }
  }

  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath(`/product/${productId}`);
}
