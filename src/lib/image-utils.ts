import { Product } from '@/types';

// Standard category-to-prefix mapping
const categoryToPrefix: Record<string, string> = {
  'One Piece WC (S-Trap)': 'one_piece_wc_s-trap',
  'Wall Hung WC': 'wall_hung_wc',
  'Floor Mounted Coupled Closet': 'floor_mounted_coupled_closet_with_dual_flush_cistern',
  'Wall Hung with Dual Flush Cistern': 'wall_hung_with_dual_flush_cistern',
  'Floor Mounted WC (EWC)': 'floor_mounted_wc',
  'Squatting Pan': 'squatting_pan',
  'Wall Hung Basin': 'wall_hung_basin',
  'Urinals — Electronic': 'electronics_urinal',
  'Urinals — Regular': 'regular_urinal',
  'Faucets — Claret Collection > Basin': 'faucet',
  'Faucets — Claret Collection > Bath': 'shower',
  'Faucets — Claret Collection > Kitchen': 'claret_kitchen',
  'Faucets — Claret Collection > Utility': 'clarinet_utility',
  'Faucets — Jade Collection > Basin': 'basin',
  'Faucets — Jade Collection > Bath': 'bath',
  'Faucets — Jade Collection > Kitchen': 'kitchen',
  'Faucets — Jade Collection > Utility': 'utility',
  'Concealed Bodies': 'concealed_body',
  'Hand Showers Collection': 'hand_shower',
  'Health Faucet Collection': 'faucet',
  'Bottle Traps': 'bottle_traps',
  'Connection Hose': 'connection_hose',
  'Waste Coupling': 'waste_coupling',
  'Polymer Cistern Dual Flush': 'floor_mounted_coupled_closet_with_dual_flush_cistern',
  'Polymer Cistern Single Flush': 'floor_mounted_coupled_closet_with_dual_flush_cistern'
};

// Map of prefixes to total image count in assets
const prefixCounts: Record<string, number> = {
  'one_piece_wc_s-trap': 27,
  'wall_hung_wc': 9,
  'floor_mounted_coupled_closet_with_dual_flush_cistern': 2,
  'wall_hung_with_dual_flush_cistern': 4,
  'floor_mounted_wc': 7,
  'squatting_pan': 4,
  'wall_hung_basin': 15,
  'electronics_urinal': 3,
  'regular_urinal': 6,
  'faucet': 12,
  'shower': 12,
  'claret_kitchen': 7,
  'clarinet_utility': 10,
  'basin': 4,
  'bath': 3,
  'kitchen': 4,
  'utility': 9,
  'concealed_body': 11,
  'hand_shower': 6,
  'bottle_traps': 1,
  'connection_hose': 2,
  'waste_coupling': 3
};

// Formats index with leading zero or keeps page number format
function getFormattedFilename(prefix: string, index: number): string {
  // Check special cases where filename format has page numbers
  if (prefix === 'one_piece_wc_s-trap') {
    if (index >= 1 && index <= 9) return `one_piece_wc_s-trap-${index}.png`;
    if (index >= 10 && index <= 18) return `one_piece_wc_s-trap-pg2-${index}.png`;
    if (index >= 19 && index <= 27) return `one_piece_wc_s-trap-pg3-${index}.png`;
  }
  
  if (prefix === 'wall_hung_wc') {
    return `wall_hung_wc-pg4-${index}.png`;
  }

  if (prefix === 'floor_mounted_coupled_closet_with_dual_flush_cistern') {
    return `floor_mounted_coupled_closet_with_dual_flush_cistern-pg5-${index}.png`;
  }

  if (prefix === 'wall_hung_with_dual_flush_cistern') {
    return `wall_hung_with_dual_flush_cistern-pg5-${index}.png`;
  }

  if (prefix === 'floor_mounted_wc') {
    return `floor_mounted_wc-pg6-${index}.png`;
  }

  if (prefix === 'squatting_pan') {
    return `squatting_pan-pg7-${index}.png`;
  }

  if (prefix === 'wall_hung_basin') {
    if (index >= 1 && index <= 9) return `wall_hung_basin-pg8-${index}.png`;
    if (index >= 10 && index <= 15) return `wall_hung_basin-pg9-${index}.png`;
  }

  if (prefix === 'electronics_urinal') {
    return `electronics_urinal-pg11-${index}.png`;
  }

  if (prefix === 'regular_urinal') {
    return `regular_urinal-pg11-${index}.png`;
  }

  // Default: prefix_XX.png (e.g. basin_01.png, claret_kitchen_01.png)
  const paddedIndex = index.toString().padStart(2, '0');
  return `${prefix}_${paddedIndex}.png`;
}

/**
 * Returns the path to the product image from public/Assets/
 */
export function getProductImagePath(product: Product): string {
  // If product already has an image path set that points to /Assets, use it
  if (product.thumbnail && product.thumbnail.startsWith('/Assets/')) {
    return product.thumbnail;
  }
  if (product.images && product.images.length > 0 && product.images[0].startsWith('/Assets/')) {
    return product.images[0];
  }

  // Dynamic matching fallback
  const category = product.category;
  const prefix = categoryToPrefix[category];
  
  if (!prefix) {
    return '/Assets/placeholder.png'; // fallback in case of misalignment
  }

  // Try to find index from product ID, or name, or slug suffix
  let productIdx = 1;
  const idMatch = product.id.match(/\d+/);
  if (idMatch) {
    productIdx = parseInt(idMatch[0], 10);
  } else {
    // try to get index from slug e.g. "product-name-12"
    const slugMatch = product.slug.match(/-(\d+)$/);
    if (slugMatch) {
      productIdx = parseInt(slugMatch[1], 10);
    }
  }

  const count = prefixCounts[prefix] || 1;
  const fileIndex = ((productIdx - 1) % count) + 1;
  
  const filename = getFormattedFilename(prefix, fileIndex);
  return `/Assets/${filename}`;
}
