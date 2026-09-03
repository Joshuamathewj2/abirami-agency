import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { products as mockProducts } from '../src/lib/mock-data';

dotenv.config({ path: '.env.local' });

const isDryRun = process.argv.includes('--dry-run');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function parseDimensions(dimStr?: string): { length: number; width: number; height: number } {
  if (!dimStr) return { length: 0, width: 0, height: 0 };
  const cleaned = dimStr.toLowerCase().replace(/mm/g, '').replace(/×/g, 'x');
  const parts = cleaned.split('x').map(p => parseInt(p.trim()) || 0);
  return {
    length: parts[0] || 0,
    width: parts[1] || 0,
    height: parts[2] || 0
  };
}

async function runMigration() {
  console.log(`=======================================================`);
  console.log(` MOCK DATA MIGRATION SCRIPT (${isDryRun ? 'DRY-RUN MODE' : 'LIVE WRITE MODE'})`);
  console.log(`=======================================================\n`);
  console.log(`Total Mock Products to Process: ${mockProducts.length}`);

  // Fetch existing categories (materials)
  const { data: existingMaterials, error: matFetchErr } = await supabase.from('materials').select('id, name');
  if (matFetchErr) {
    console.error('Error fetching materials:', matFetchErr.message);
    process.exit(1);
  }

  const materialMap = new Map<string, string>();
  existingMaterials?.forEach(m => materialMap.set(m.name, m.id));

  // Fetch existing mattresses to guarantee idempotency
  const { data: existingMattresses, error: mattrFetchErr } = await supabase.from('mattresses').select('id, name');
  if (mattrFetchErr) {
    console.error('Error fetching mattresses:', mattrFetchErr.message);
    process.exit(1);
  }

  const existingNameSet = new Set(existingMattresses?.map(m => m.name.toLowerCase().trim()));
  console.log(`Found ${existingMattresses?.length || 0} existing products in Supabase database.\n`);

  const categoryStats: Record<string, { toInsert: number; skipped: number; variantsCount: number; imagesCount: number }> = {};

  let totalToInsert = 0;
  let totalSkipped = 0;
  let totalVariantsToInsert = 0;
  let totalImagesToInsert = 0;

  for (const mockP of mockProducts) {
    const catName = mockP.category || 'Water Closet';
    if (!categoryStats[catName]) {
      categoryStats[catName] = { toInsert: 0, skipped: 0, variantsCount: 0, imagesCount: 0 };
    }

    const isAlreadyInDB = existingNameSet.has(mockP.name.toLowerCase().trim());
    if (isAlreadyInDB) {
      categoryStats[catName].skipped++;
      totalSkipped++;
      continue;
    }

    categoryStats[catName].toInsert++;
    totalToInsert++;

    const variants = mockP.sizes && mockP.sizes.length > 0 ? mockP.sizes : [{
      id: `var-${mockP.id}`,
      label: 'Standard',
      dimensions: mockP.specifications?.['Dimensions'] || '',
      price: mockP.price,
      mrp: mockP.mrp,
      inStock: mockP.inStock
    }];

    const images = mockP.images && mockP.images.length > 0 ? mockP.images : [mockP.thumbnail || 'https://placehold.co/800x600/0091FF/white?text=No+Image'];

    categoryStats[catName].variantsCount += variants.length;
    categoryStats[catName].imagesCount += images.length;

    totalVariantsToInsert += variants.length;
    totalImagesToInsert += images.length;

    if (!isDryRun) {
      // 1. Get or create Material (Category)
      let materialId: string | undefined = materialMap.get(catName);
      if (!materialId) {
        const { data: newMat, error: matErr } = await supabase.from('materials').insert({ name: catName }).select('id').single();
        if (matErr || !newMat) {
          console.error(`Failed to insert material "${catName}":`, matErr?.message);
          continue;
        }
        materialId = newMat.id as string;
        materialMap.set(catName, materialId);
      }

      // 2. Insert Mattress
      const specifications = mockP.specifications || {};
      const capacity = specifications['Capacity'] || null;
      const catalogPage = specifications['Catalog Page Reference'] || null;

      const descriptionObj = {
        description: mockP.description || mockP.shortDescription || '',
        subCategory: mockP.subCategory || '',
        colorVariants: [],
        specifications
      };

      const { data: insertedMattress, error: mattressErr } = await supabase
        .from('mattresses')
        .insert({
          name: mockP.name,
          description: JSON.stringify(descriptionObj),
          material_id: materialId,
          is_active: true,
          specifications,
          capacity,
          catalog_page: catalogPage
        })
        .select('id')
        .single();

      if (mattressErr || !insertedMattress) {
        console.error(`Failed to insert mattress "${mockP.name}":`, mattressErr?.message);
        continue;
      }

      // 3. Insert Product Images
      const imageRecords = images.map((imgUrl, idx) => ({
        mattress_id: insertedMattress.id,
        image_url: imgUrl,
        is_primary: idx === 0,
        sort_order: idx
      }));
      await supabase.from('product_images').insert(imageRecords);

      // 4. Insert Variants
      const variantRecords = variants.map((v, idx) => {
        const dims = parseDimensions(v.dimensions || mockP.specifications?.['Dimensions'] || '');
        const vSku = `${mockP.slug.toUpperCase()}-V${idx + 1}`;
        return {
          mattress_id: insertedMattress.id,
          size_name: v.label || 'Standard',
          length: dims.length,
          width: dims.width,
          height: dims.height,
          price: v.price || mockP.price,
          original_price: (v as any).mrp || mockP.mrp || null,
          stock: v.inStock ? 10 : 0,
          sku: vSku
        };
      });

      await supabase.from('variants').insert(variantRecords);
    }
  }

  console.log(`-------------------------------------------------------`);
  console.log(` SUMMARY BREAKDOWN BY CATEGORY`);
  console.log(`-------------------------------------------------------`);
  Object.entries(categoryStats).forEach(([cat, stats]) => {
    console.log(`Category: "${cat}"`);
    console.log(`  - Products to Insert: ${stats.toInsert}`);
    console.log(`  - Already in DB (Skipped): ${stats.skipped}`);
    console.log(`  - Variants to Create: ${stats.variantsCount}`);
    console.log(`  - Product Images to Create: ${stats.imagesCount}\n`);
  });

  console.log(`=======================================================`);
  console.log(` TOTALS (${isDryRun ? 'DRY-RUN RESULT' : 'LIVE MIGRATION COMPLETE'})`);
  console.log(`=======================================================`);
  console.log(`- Total Mock Products Evaluated : ${mockProducts.length}`);
  console.log(`- Products to be Inserted       : ${totalToInsert}`);
  console.log(`- Products Skipped (Already DB) : ${totalSkipped}`);
  console.log(`- Total Variants to Create      : ${totalVariantsToInsert}`);
  console.log(`- Total Image Records to Create : ${totalImagesToInsert}`);
  console.log(`=======================================================\n`);

  if (isDryRun) {
    console.log(`>>> DRY-RUN COMPLETED SUCCESSFULLY. NO WRITES WERE MADE TO SUPABASE.`);
  } else {
    console.log(`>>> MIGRATION SUCCESSFUL! ALL MOCK PRODUCTS WRITTEN TO SUPABASE.`);
  }
}

runMigration();
