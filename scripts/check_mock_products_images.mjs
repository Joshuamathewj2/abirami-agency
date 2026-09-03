import { products } from '../src/lib/mock-data.ts';

console.log(`Mock products count: ${products.length}`);
const imageless = products.filter(p => !p.images || p.images.length === 0 || !p.thumbnail);
console.log(`Imageless mock products count: ${imageless.length}`);
imageless.forEach(p => {
  console.log(`- [${p.id}] ${p.name} (Category: ${p.category})`);
});
