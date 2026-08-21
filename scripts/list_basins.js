const fs = require('fs');
const path = require('path');

const products = require('./products_list.json');

console.log("Wall Hung Basin products:");
const basins = products.filter(p => p.category === 'Wall Hung Basin');
basins.forEach((p, idx) => {
  console.log(`  ${idx + 1}. [${p.id}] ${p.name}`);
});

console.log("\nFloor Mounted WC (EWC) products:");
const ewcs = products.filter(p => p.category === 'Floor Mounted WC (EWC)');
ewcs.forEach((p, idx) => {
  console.log(`  ${idx + 1}. [${p.id}] ${p.name}`);
});
