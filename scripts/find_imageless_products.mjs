import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Fetching all mattresses from Supabase...');
  
  const { data: mattresses, error } = await supabase
    .from('mattresses')
    .select(`
      id, name, is_active,
      materials ( id, name ),
      product_images_m:product_images!product_images_mattress_id_fkey ( id, image_url, is_primary, sort_order ),
      product_images_p:product_images!product_images_product_id_fkey ( id, image_url, is_primary, sort_order ),
      variants!variants_mattress_id_fkey ( id )
    `)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching mattresses:', error);
    process.exit(1);
  }

  console.log(`Total products in DB: ${mattresses.length}`);

  let noImagesCount = 0;
  let placeholderCount = 0;
  let validCount = 0;

  const noImageProducts = [];
  const placeholderProducts = [];

  for (const m of mattresses) {
    const images = [...(m.product_images_m || []), ...(m.product_images_p || [])];
    const imageUrls = images.map(img => img.image_url).filter(Boolean);

    if (imageUrls.length === 0) {
      noImagesCount++;
      noImageProducts.push({
        id: m.id,
        name: m.name,
        category: m.materials?.name || 'Uncategorized',
        is_active: m.is_active,
        reason: 'Zero image records'
      });
    } else {
      const realImages = imageUrls.filter(url => !url.includes('placehold') && !url.includes('dummyimage') && url.trim() !== '');
      if (realImages.length === 0) {
        placeholderCount++;
        placeholderProducts.push({
          id: m.id,
          name: m.name,
          category: m.materials?.name || 'Uncategorized',
          is_active: m.is_active,
          reason: 'Only placeholder images',
          urls: imageUrls
        });
      } else {
        validCount++;
      }
    }
  }

  console.log('\n========================================');
  const categoriesMap = {};
  for (const m of mattresses) {
    const cat = m.materials?.name || 'Uncategorized';
    if (!categoriesMap[cat]) categoriesMap[cat] = { total: 0, sampleImage: '' };
    categoriesMap[cat].total++;
    const images = [...(m.product_images_m || []), ...(m.product_images_p || [])];
    if (!categoriesMap[cat].sampleImage && images[0]?.image_url) {
      categoriesMap[cat].sampleImage = images[0].image_url;
    }
  }

  console.log('\n--- CATEGORY BREAKDOWN & SAMPLE IMAGE URLS ---');
  Object.entries(categoriesMap).forEach(([cat, info]) => {
    console.log(`• ${cat}: ${info.total} products | Sample Image: ${info.sampleImage}`);
  });

  if (noImageProducts.length > 0) {
    console.log('--- PRODUCTS WITH 0 IMAGE RECORDS ---');
    noImageProducts.forEach((p, idx) => {
      console.log(`${idx + 1}. [ID: ${p.id}] "${p.name}" (Category: ${p.category}) | Active: ${p.is_active}`);
    });
  }

  if (placeholderProducts.length > 0) {
    console.log('\n--- PRODUCTS WITH ONLY PLACEHOLDER IMAGES ---');
    placeholderProducts.forEach((p, idx) => {
      console.log(`${idx + 1}. [ID: ${p.id}] "${p.name}" (Category: ${p.category}) | Active: ${p.is_active} | URLs: ${p.urls.join(', ')}`);
    });
  }
}

main();
