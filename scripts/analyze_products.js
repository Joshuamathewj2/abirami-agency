const fs = require('fs');
const path = require('path');

const mockDataContent = fs.readFileSync(path.join(__dirname, '../src/lib/mock-data.ts'), 'utf8');

// A simple parser to extract products and categories
// Since it's a TS file, we can extract the objects or just do a simple match.
// Let's count how many products have SVG_PLACEHOLDER or any images
const productBlocks = [];
let braceCount = 0;
let inProduct = false;
let currentBlock = '';

// Let's extract the array elements inside `export const products: Product[] = [ ... ]`
const arrayMatch = mockDataContent.match(/export const products:\s*Product\[\]\s*=\s*\[([\s\S]*?)\];/);
if (!arrayMatch) {
  console.log("Could not find products array");
  process.exit(1);
}

const productsText = arrayMatch[1];
// Let's extract individual objects {}
let currentObject = '';
let openBraces = 0;
const objects = [];

for (let i = 0; i < productsText.length; i++) {
  const char = productsText[i];
  if (char === '{') {
    if (openBraces === 0) {
      currentObject = '';
    }
    openBraces++;
  }
  if (openBraces > 0) {
    currentObject += char;
  }
  if (char === '}') {
    openBraces--;
    if (openBraces === 0) {
      objects.push(currentObject);
    }
  }
}

console.log(`Found ${objects.length} product objects.`);

// Parse each product object to extract category, name, slug, and check if it has SVG_PLACEHOLDER
const parsedProducts = objects.map((objText, idx) => {
  const nameMatch = objText.match(/name:\s*['"`](.*?)['"`]/);
  const categoryMatch = objText.match(/category:\s*['"`](.*?)['"`]/);
  const slugMatch = objText.match(/slug:\s*['"`](.*?)['"`]/);
  const idMatch = objText.match(/id:\s*['"`](.*?)['"`]/);
  const thumbnailMatch = objText.match(/thumbnail:\s*(.*?)[,\n]/);

  return {
    index: idx,
    id: idMatch ? idMatch[1] : null,
    name: nameMatch ? nameMatch[1] : null,
    category: categoryMatch ? categoryMatch[1] : null,
    slug: slugMatch ? slugMatch[1] : null,
    thumbnail: thumbnailMatch ? thumbnailMatch[1].trim() : null
  };
});

const categoryCounts = {};
parsedProducts.forEach(p => {
  categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
});

console.log("Categories and counts in mock-data.ts:");
console.log(categoryCounts);

// Let's list files in public/Assets
const assetsDir = path.join(__dirname, '../public/Assets');
const assetFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.png'));
console.log(`\nFound ${assetFiles.length} image files in public/Assets.`);

// Group assets by prefix
const assetPrefixes = {};
assetFiles.forEach(file => {
  const prefix = file.replace(/(_\d+|-\d+|-pg\d+-\d+)\.png$/, '');
  assetPrefixes[prefix] = (assetPrefixes[prefix] || 0) + 1;
});
console.log("\nAsset prefixes in public/Assets:");
console.log(assetPrefixes);
