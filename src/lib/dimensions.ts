/**
 * Dimensions and Product Name Formatting Helpers
 * Abirami Agency - Parryware Sanitaryware
 * 
 * Rules:
 * 1. Dimensions are only valid if length, width, and height are all valid numbers > 0.
 * 2. If any dimension is 0, negative, null, empty, or undefined, formatDimensions returns ''.
 * 3. Prevents duplicate SKU in product display names (e.g. when SKU is already part of the name).
 */

export interface DimensionInput {
  length?: number | string | null;
  width?: number | string | null;
  height?: number | string | null;
  dimensions?: string | null;
  unit?: string;
}

/**
 * Validates and formats physical dimensions.
 * Returns an empty string ('') unless all three dimensions (length, width, height) are > 0.
 */
export function formatDimensions(
  input: DimensionInput | string | null | undefined,
  defaultUnit: string = 'mm'
): string {
  if (!input) return '';

  // If a raw string was passed (e.g. '0" × 0" × 0"' or '690 × 380 × 750 mm')
  if (typeof input === 'string') {
    const raw = input.trim();
    if (!raw || raw.toLowerCase() === 'standard' || raw.toLowerCase() === 'custom') {
      return '';
    }

    // Check for junk patterns like 0" × 0" or 0 x 0
    if (/^0+(\.0+)?\s*["']?\s*[×x*]/i.test(raw) || /[×x*]\s*0+(\.0+)?\s*["']?(\s*[×x*]|$)/i.test(raw)) {
      return '';
    }

    // Extract all numeric segments
    const matches = raw.match(/\d+(\.\d+)?/g);
    if (!matches || matches.length < 3) {
      return '';
    }

    const [l, w, h] = matches.map(Number);
    if (l <= 0 || w <= 0 || h <= 0) {
      return '';
    }

    // Determine unit
    let unit = defaultUnit;
    if (raw.includes('"') || raw.toLowerCase().includes('inch')) {
      unit = 'inch';
    } else if (raw.toLowerCase().includes('mm')) {
      unit = 'mm';
    } else if (raw.toLowerCase().includes('cm')) {
      unit = 'cm';
    }

    return `${l} × ${w} × ${h} ${unit}`.trim();
  }

  // If an object with dimensions string property is passed
  if (input.dimensions && (!input.length || !input.width)) {
    return formatDimensions(input.dimensions, input.unit || defaultUnit);
  }

  const l = typeof input.length === 'string' ? parseFloat(input.length) : Number(input.length);
  const w = typeof input.width === 'string' ? parseFloat(input.width) : Number(input.width);
  const h = typeof input.height === 'string' ? parseFloat(input.height) : Number(input.height);

  if (isNaN(l) || l <= 0 || isNaN(w) || w <= 0 || isNaN(h) || h <= 0) {
    return '';
  }

  const unit = input.unit || defaultUnit;
  return `${l} × ${w} × ${h} ${unit}`.trim();
}

/**
 * Checks whether an item or variant has valid dimensions.
 */
export function hasValidDimensions(input: DimensionInput | string | null | undefined): boolean {
  return formatDimensions(input) !== '';
}

/**
 * Cleans and builds a display name without duplicating the SKU or appending empty dimensions.
 */
export function cleanDisplayName({
  productName,
  sku,
  sizeName,
  dimensions,
}: {
  productName: string;
  sku?: string | null;
  sizeName?: string | null;
  dimensions?: string | null;
}): {
  displayName: string;
  formattedDimensions: string;
  cleanSku: string;
} {
  const pName = (productName || '').trim();
  const rawSku = (sku || '').trim();
  const rawSize = (sizeName || '').trim();
  const validDims = formatDimensions(dimensions);

  // Normalize SKU for comparison
  const skuNorm = rawSku.toLowerCase();

  // Determine if sizeName is meaningful (not 'Standard', not just the SKU)
  const isStandardSize = !rawSize || rawSize.toLowerCase() === 'standard';
  const sizeIsSku = rawSize.toLowerCase() === skuNorm;
  const nameAlreadyHasSize = rawSize && pName.toLowerCase().includes(rawSize.toLowerCase());

  let variantBadge = '';
  if (!isStandardSize && !sizeIsSku && !nameAlreadyHasSize) {
    variantBadge = rawSize;
  }

  // Construct label
  const parts: string[] = [];
  if (variantBadge) parts.push(variantBadge);
  if (validDims) parts.push(validDims);

  let displayName = pName;
  if (parts.length > 0) {
    displayName = `${pName} (${parts.join(', ')})`;
  }

  return {
    displayName,
    formattedDimensions: validDims,
    cleanSku: rawSku,
  };
}
