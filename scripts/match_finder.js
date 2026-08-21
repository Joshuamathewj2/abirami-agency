const fs = require('fs');
const path = require('path');

const products = require('./products_list.json');
const assetsDir = path.join(__dirname, '../public/Assets');
const assetFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.png'));

// Let's sort asset files numerically
function getFileIndex(filename) {
  const match = filename.match(/(\d+)\.png$/);
  return match ? parseInt(match[1], 10) : 0;
}

function getPrefix(filename) {
  return filename.replace(/(_\d+|-\d+|-pg\d+-\d+)\.png$/, '');
}

// Group asset files by prefix and sort them by their trailing index
const assetsByPrefix = {};
assetFiles.forEach(file => {
  const prefix = getPrefix(file);
  if (!assetsByPrefix[prefix]) {
    assetsByPrefix[prefix] = [];
  }
  assetsByPrefix[prefix].push(file);
});

// Sort files within each prefix
for (const prefix in assetsByPrefix) {
  assetsByPrefix[prefix].sort((a, b) => getFileIndex(a) - getFileIndex(b));
}

// Let's analyze each category and find candidate prefixes
const categories = [...new Set(products.map(p => p.category))];

console.log("Analyzing mappings:");
categories.forEach(cat => {
  const catProducts = products.filter(p => p.category === cat);
  console.log(`\nCategory: "${cat}" (${catProducts.length} products)`);
  
  // Find products that contain certain keywords
  const sampleNames = catProducts.slice(0, 3).map(p => p.name).join(', ');
  console.log(`  Samples: ${sampleNames}`);
  
  // Let's find best matching prefix by name overlap or category name
  let bestPrefix = '';
  let maxOverlap = 0;
  
  const cleanCat = cat.toLowerCase().replace(/[^a-z0-9]/g, '_');
  for (const prefix in assetsByPrefix) {
    // Check overlap of tokens
    const catTokens = cleanCat.split('_').filter(t => t.length > 2);
    const prefixTokens = prefix.split('_').filter(t => t.length > 2);
    let overlap = 0;
    catTokens.forEach(ct => {
      if (prefixTokens.includes(ct)) overlap++;
    });
    
    if (overlap > maxOverlap) {
      maxOverlap = overlap;
      bestPrefix = prefix;
    }
  }
  
  console.log(`  Suggested Prefix: ${bestPrefix} (${assetsByPrefix[bestPrefix] ? assetsByPrefix[bestPrefix].length : 0} images)`);
});
