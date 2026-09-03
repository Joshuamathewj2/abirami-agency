import { Product } from '@/types';

// Standard category-to-prefix mapping (must match filenames in /public/Assets1/)
const categoryToPrefix: Record<string, string> = {
  'One Piece WC (S-Trap)': 'one_piece_wc_s-trap',
  'Wall Hung WC': 'wall_hung_wc',
  'Floor Mounted Coupled Closet': 'floor_mounted_coupled_closet',
  'Wall Hung with Dual Flush Cistern': 'wall_hung_wc',
  'Floor Mounted WC (EWC)': 'floor_mounted_wc',
  'Squatting Pan': 'squatting_pan',
  'Wall Hung Basin': 'long_pedestal',
  'Long Pedestal Basin': 'long_pedestal',
  'Urinals — Electronic': 'electronics_urinal',
  'Urinals — Regular': 'regular_urinal',
  'Faucets — Claret Collection > Basin': 'faucet',
  'Faucets — Claret Collection > Bath': 'shower',
  'Faucets — Claret Collection > Kitchen': 'claret_utility',
  'Faucets — Claret Collection > Utility': 'claret_utility',
  'Faucets — Jade Collection > Basin': 'basin',
  'Faucets — Jade Collection > Bath': 'bath',
  'Faucets — Jade Collection > Kitchen': 'kitchen',
  'Faucets — Jade Collection > Utility': 'clarinet_utility',
  'Concealed Bodies': 'concealed_body',
  'Hand Showers Collection': 'hand_shower',
  'Health Faucet Collection': 'faucet',
  'Bottle Traps': 'bottle_traps',
  'Connection Hose': 'connection_hose',
  'Waste Coupling': 'waste_coupling',
  'Polymer Cistern Dual Flush': 'floor_mounted_coupled_closet',
  'Polymer Cistern Single Flush': 'floor_mounted_coupled_closet',
};

// Map of prefixes to actual file count in /public/Assets1/
// Verified against actual directory listing
const prefixCounts: Record<string, number> = {
  'one_piece_wc_s-trap': 27,
  'wall_hung_wc': 0,        // No wall_hung_wc files in Assets1 — use long_pedestal fallback
  'floor_mounted_coupled_closet': 2,
  'floor_mounted_wc': 7,
  'squatting_pan': 4,
  'long_pedestal': 9,
  'electronics_urinal': 3,
  'regular_urinal': 6,
  'faucet': 12,
  'shower': 12,
  'claret_utility': 7,
  'clarinet_utility': 10,
  'basin': 4,
  'bath': 3,
  'kitchen': 4,
  'concealed_body': 11,
  'hand_shower': 6,
  'bottle_traps': 1,
  'connection_hose': 2,
  'waste_coupling': 3,
};

/**
 * Returns the formatted filename for a given prefix and 1-based index.
 * All filenames in Assets1 use zero-padded two-digit suffixes like _01.png,
 * EXCEPT long_pedestal which uses no zero-padding: long_pedestal_1.png
 * one_piece_wc_s-trap uses hyphens: one_piece_wc_s-trap-01.png
 */
function getFormattedFilename(prefix: string, index: number): string {
  // Special case: one_piece_wc_s-trap uses hyphen separator (still zero-padded)
  if (prefix === 'one_piece_wc_s-trap') {
    return `one_piece_wc_s-trap-${String(index).padStart(2, '0')}.png`;
  }

  // Special case: long_pedestal uses no zero-padding
  if (prefix === 'long_pedestal') {
    return `long_pedestal_${index}.png`;
  }

  // All other prefixes use underscore and zero-padded two digits: prefix_NN.png
  const paddedIndex = String(index).padStart(2, '0');
  return `${prefix}_${paddedIndex}.png`;
}

/**
 * Returns the public path to the product image from /Assets1/
 */
export function getProductImagePath(product: Product): string {
  const isValidUrl = (url?: string | null): boolean => {
    if (!url) return false;
    return (
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('data:') ||
      url.startsWith('blob:') ||
      url.startsWith('/Assets1/') ||
      url.startsWith('/Assets/')
    );
  };

  // 1. Use product thumbnail if it's a valid path/URL
  if (isValidUrl(product.thumbnail)) {
    return product.thumbnail.startsWith('/Assets/') ? product.thumbnail.replace('/Assets/', '/Assets1/') : product.thumbnail;
  }
  // 2. Use first image if it's a valid path/URL
  if (product.images && product.images.length > 0 && isValidUrl(product.images[0])) {
    return product.images[0].startsWith('/Assets/') ? product.images[0].replace('/Assets/', '/Assets1/') : product.images[0];
  }

  // 4. Dynamic matching fallback by category
  const category = product.category;
  const prefix = categoryToPrefix[category];

  if (!prefix || prefixCounts[prefix] === 0) {
    // No matching prefix — use a real existing file as placeholder
    return '/Assets1/faucet_01.png';
  }

  // Derive index from product ID numeric suffix
  let productIdx = 1;
  const idMatch = product.id.match(/\d+/);
  if (idMatch) {
    productIdx = parseInt(idMatch[0], 10);
  } else {
    const slugMatch = product.slug.match(/-(\d+)$/);
    if (slugMatch) {
      productIdx = parseInt(slugMatch[1], 10);
    }
  }

  const count = prefixCounts[prefix] || 1;
  const fileIndex = ((productIdx - 1) % count) + 1;

  const filename = getFormattedFilename(prefix, fileIndex);
  return `/Assets1/${filename}`;
}
