/**
 * Shared GST Calculation Engine & Currency Utilities for Abirami Agency
 * Single source of truth for POS Billing, Orders History, and Invoices.
 */

export type InvoiceType = 'gst' | 'non-gst';
export type GstMode = 'inclusive' | 'exclusive';
export type PaymentMethod = 'cash' | 'gpay' | 'split' | 'credit';

export interface CalculateTotalsInput {
  subtotal?: number;
  items?: { price: number; quantity: number }[];
  couponDiscount?: number;
  manualDiscount?: number;
  deliveryFee?: number;
  invoiceType?: InvoiceType;
  isGst?: boolean;
  gstMode?: GstMode;
  gstRate?: number;
}

export interface TotalsCalculationResult {
  invoiceType: InvoiceType;
  gstMode: GstMode;
  gstRate: number;
  subtotal: number;
  totalDiscount: number;
  delivery: number;
  taxableAmount: number;
  gstTotal: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
}

/**
 * Calculates financial totals using integer paise to avoid IEEE-754 floating point errors.
 * Calculation order:
 * Subtotal -> minus discount -> plus delivery -> GST.
 *
 * Delivery forms part of the taxable base under Indian GST composite supply rules.
 */
export function calculateTotals(input: CalculateTotalsInput): TotalsCalculationResult {
  // 1. Resolve subtotal
  let subtotal = 0;
  if (input.subtotal !== undefined) {
    subtotal = Number(input.subtotal) || 0;
  } else if (input.items && Array.isArray(input.items)) {
    subtotal = input.items.reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 0), 0);
  }

  // 2. Resolve discounts & delivery
  const couponDiscount = Math.max(0, Number(input.couponDiscount) || 0);
  const manualDiscount = Math.max(0, Number(input.manualDiscount) || 0);
  const totalDiscount = couponDiscount + manualDiscount;
  const delivery = Math.max(0, Number(input.deliveryFee) || 0);

  // 3. Resolve GST flags and rate
  const isGst = input.invoiceType ? input.invoiceType === 'gst' : Boolean(input.isGst);
  const invoiceType: InvoiceType = isGst ? 'gst' : 'non-gst';
  const gstMode: GstMode = input.gstMode === 'exclusive' ? 'exclusive' : 'inclusive';
  const gstRate = isGst ? Math.max(0, Number(input.gstRate ?? 18)) : 0;

  // Convert to integer paise
  const subtotalPaise = Math.round(subtotal * 100);
  const discountPaise = Math.min(subtotalPaise, Math.round(totalDiscount * 100));
  const postDiscountPaise = Math.max(0, subtotalPaise - discountPaise);
  const deliveryPaise = Math.round(delivery * 100);
  const taxableBasePaise = postDiscountPaise + deliveryPaise;

  let taxablePaise = 0;
  let gstTotalPaise = 0;
  let grandTotalPaise = 0;

  if (!isGst || gstRate === 0) {
    taxablePaise = taxableBasePaise;
    gstTotalPaise = 0;
    grandTotalPaise = taxableBasePaise;
  } else if (gstMode === 'exclusive') {
    // Exclusive mode: GST is added on top of the taxable base
    taxablePaise = taxableBasePaise;
    gstTotalPaise = Math.round((taxablePaise * gstRate) / 100);
    grandTotalPaise = taxablePaise + gstTotalPaise;
  } else {
    // Inclusive mode: Taxable base already contains the GST
    // Total = Taxable + (Taxable * Rate / 100) = Taxable * (100 + Rate) / 100
    // => GST = Total * Rate / (100 + Rate)
    // => Taxable = Total - GST
    grandTotalPaise = taxableBasePaise;
    gstTotalPaise = Math.round((grandTotalPaise * gstRate) / (100 + gstRate));
    taxablePaise = grandTotalPaise - gstTotalPaise;
  }

  // Intra-state Tamil Nadu CGST/SGST split
  const cgstPaise = Math.round(gstTotalPaise / 2);
  const sgstPaise = gstTotalPaise - cgstPaise;

  return {
    invoiceType,
    gstMode,
    gstRate,
    subtotal: subtotalPaise / 100,
    totalDiscount: discountPaise / 100,
    delivery: deliveryPaise / 100,
    taxableAmount: taxablePaise / 100,
    gstTotal: gstTotalPaise / 100,
    cgst: cgstPaise / 100,
    sgst: sgstPaise / 100,
    grandTotal: grandTotalPaise / 100,
  };
}

/**
 * Converts integer numbers to Indian English Words for receipts and invoices.
 * e.g. 2100 -> "Two Thousand One Hundred Rupees Only"
 */
export function numberToIndianWords(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'Zero Rupees Only';

  const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const double = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 10) return single[n];
    if (n < 20) return double[n - 10];
    const unit = n % 10;
    return `${tens[Math.floor(n / 10)]}${unit ? ` ${single[unit]}` : ''}`;
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    const hundredStr = hundred ? `${single[hundred]} Hundred` : '';
    const restStr = convertTwoDigits(rest);
    if (hundredStr && restStr) return `${hundredStr} and ${restStr}`;
    return hundredStr || restStr;
  }

  let remaining = rounded;
  const parts: string[] = [];

  const crores = Math.floor(remaining / 10000000);
  remaining %= 10000000;
  if (crores > 0) parts.push(`${convertTwoDigits(crores)} Crore`);

  const lakhs = Math.floor(remaining / 100000);
  remaining %= 100000;
  if (lakhs > 0) parts.push(`${convertTwoDigits(lakhs)} Lakh`);

  const thousands = Math.floor(remaining / 1000);
  remaining %= 1000;
  if (thousands > 0) parts.push(`${convertTwoDigits(thousands)} Thousand`);

  if (remaining > 0) {
    parts.push(convertThreeDigits(remaining));
  }

  return `${parts.join(' ')} Rupees Only`.trim();
}
