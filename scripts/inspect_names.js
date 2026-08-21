const fs = require('fs');
const path = require('path');

const products = require('./products_list.json');

console.log("Checking categories and their products:");

const searchTerms = ['pedestal', 'pedastal', 'cistern', 'flush', 'shower', 'health'];
searchTerms.forEach(term => {
  const matches = products.filter(p => p.name.toLowerCase().includes(term) || (p.category && p.category.toLowerCase().includes(term)));
  console.log(`\nMatches for "${term}" (${matches.length} products):`);
  matches.slice(0, 5).forEach(m => {
    console.log(`  - [${m.category}] ${m.name} (id: ${m.id})`);
  });
});
