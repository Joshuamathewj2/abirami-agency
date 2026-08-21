const fs = require('fs');
const path = require('path');

const mockDataContent = fs.readFileSync(path.join(__dirname, '../src/lib/mock-data.ts'), 'utf8');

const arrayMatch = mockDataContent.match(/export const products:\s*Product\[\]\s*=\s*\[([\s\S]*?)\];/);
if (!arrayMatch) {
  console.log("Could not find products array");
  process.exit(1);
}

const productsText = arrayMatch[1];
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

// Let's write out all parsed products to a file so we can inspect it easily
fs.writeFileSync(path.join(__dirname, '../scripts/products_list.json'), JSON.stringify(parsedProducts, null, 2));

console.log("Written products_list.json with details.");
