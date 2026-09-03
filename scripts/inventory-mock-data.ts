import { products } from '../src/lib/mock-data';

console.log(`========================================`);
console.log(`TOTAL MOCK PRODUCTS COUNT: ${products.length}`);
console.log(`========================================\n`);

const categoryCounts: Record<string, number> = {};
const subCategoryCounts: Record<string, number> = {};
const sampleByCat: Record<string, any[]> = {};

products.forEach((p, idx) => {
  const cat = p.category || 'Uncategorized';
  categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  
  const subCat = p.subCategory || 'None';
  subCategoryCounts[subCat] = (subCategoryCounts[subCat] || 0) + 1;

  if (!sampleByCat[cat]) sampleByCat[cat] = [];
  sampleByCat[cat].push({
    index: idx + 1,
    id: p.id,
    name: p.name,
    subCategory: p.subCategory,
    price: p.price,
    mrp: p.mrp,
    sizesCount: p.sizes?.length || 0,
    imagesCount: p.images?.length || 0,
    firstImage: p.images?.[0] || p.thumbnail || null
  });
});

console.log('--- PRODUCTS BY CATEGORY ---');
Object.entries(categoryCounts).forEach(([cat, count]) => {
  console.log(`- ${cat}: ${count} products`);
});

console.log('\n--- PRODUCTS BY SUBCATEGORY ---');
Object.entries(subCategoryCounts).forEach(([subCat, count]) => {
  console.log(`- ${subCat}: ${count} products`);
});

console.log('\n--- DETAILED INVENTORY SUMMARY ---');
products.forEach((p, i) => {
  console.log(`${i + 1}. [${p.id}] ${p.name}`);
  console.log(`   Category: "${p.category}" | SubCategory: "${p.subCategory || ''}"`);
  console.log(`   Price: ₹${p.price} | MRP: ${p.mrp ? '₹' + p.mrp : 'N/A'}`);
  console.log(`   Variants (${p.sizes?.length || 0}): ${p.sizes?.map(s => `${s.label} (₹${s.price})`).join(', ') || 'None'}`);
  console.log(`   Images (${p.images?.length || 0}): ${p.images?.[0] || 'No image'}`);
  console.log(`   Specs: ${JSON.stringify(p.specifications || {})}`);
});
