const fs = require('fs');
const path = require('path');

const mappings = require('./mappings.json');
const mockDataPath = path.join(__dirname, '../src/lib/mock-data.ts');
let mockDataContent = fs.readFileSync(mockDataPath, 'utf8');

// For each mapping, we'll replace the images and thumbnail lines for the corresponding product.
// Since each product has a unique id, we can find the product block starting at its id
// and replace its images and thumbnail values up to the end of the block.

mappings.forEach(m => {
  // Find index of `id: 'm.id'`
  const idRegex = new RegExp(`id:\\s*['"]${m.id}['"]`);
  const match = mockDataContent.match(idRegex);
  if (!match) {
    console.log(`Could not find product with id ${m.id}`);
    return;
  }
  
  const startIndex = match.index;
  // Let's find the end of this product block (matching next object or end of array)
  // We can search for the next id: 'pXX' or end of array.
  // A simpler way: find the next `id:` or `materials:` or whatever, but let's locate the `images:` and `thumbnail:` lines within the next 400 characters.
  const searchSlice = mockDataContent.slice(startIndex, startIndex + 600);
  
  // Replace images: [...]
  const imagesRegex = /images:\s*\[[\s\S]*?\],/;
  const newImagesStr = `images: ["/Assets/${m.mappedFile}"],`;
  
  // Replace thumbnail: ...
  const thumbnailRegex = /thumbnail:\s*(['"`][\s\S]*?['"`]|SVG_PLACEHOLDER),/;
  const newThumbnailStr = `thumbnail: "/Assets/${m.mappedFile}",`;
  
  let updatedSlice = searchSlice.replace(imagesRegex, newImagesStr);
  updatedSlice = updatedSlice.replace(thumbnailRegex, newThumbnailStr);
  
  mockDataContent = mockDataContent.slice(0, startIndex) + updatedSlice + mockDataContent.slice(startIndex + 600);
});

fs.writeFileSync(mockDataPath, mockDataContent, 'utf8');
console.log("Successfully updated src/lib/mock-data.ts with image assets!");
