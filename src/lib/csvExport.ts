/**
 * Reusable CSV Exporter Utility for Abirami Agency
 * Adheres to RFC 4180 standards:
 * - Prepends UTF-8 BOM (\uFEFF) to prevent character encoding distortion (e.g. ₹ showing as â,¹)
 * - Uses MIME type 'text/csv;charset=utf-8;'
 * - Properly quotes and escapes double quotes in all fields
 * - Formats phone numbers & pure numeric IDs as Excel text formulas (="value") to prevent scientific notation (9.2E+09)
 * - Outputs monetary values as clean decimals without currency symbols in cells for sorting and summability
 * - Ensures consistent column counts across all rows
 */

import { formatDimensions, cleanDisplayName } from '@/lib/dimensions';

export interface ExportCsvOptions {
  filename: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
}

/**
 * Escapes a cell value according to RFC 4180 rules.
 */
export function escapeCsvCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) {
    return '""';
  }
  const str = String(val);
  // Replace internal double quotes with escaped double-quotes ("" )
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Forces a numeric string (like phone numbers or long codes) to be read as plain text in Excel
 * by wrapping it in an Excel formula: ="value".
 */
export function formatPhoneForCsv(phone?: string | null | number): string {
  if (phone === null || phone === undefined) return '';
  const cleaned = String(phone).replace(/[^\d+]/g, '').trim();
  if (!cleaned) return '';
  return `="${cleaned}"`;
}

/**
 * Forces numeric IDs to be treated as text by Excel if needed.
 */
export function formatIdForCsv(id?: string | null | number): string {
  if (id === null || id === undefined) return '';
  const str = String(id).trim();
  if (!str) return '';
  // If purely numeric, wrap in formula to prevent Excel stripping leading zeros or exponential notation
  if (/^\d+$/.test(str)) {
    return `="${str}"`;
  }
  return str;
}

/**
 * Formats an ISO date string into Indian Standard Time (DD-MM-YYYY and HH:mm).
 */
export function formatIndianDateTime(isoString?: string): { date: string; time: string } {
  if (!isoString) return { date: '', time: '' };
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return { date: '', time: '' };

  try {
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(d);
    const day = parts.find((p) => p.type === 'day')?.value || '';
    const month = parts.find((p) => p.type === 'month')?.value || '';
    const year = parts.find((p) => p.type === 'year')?.value || '';
    const hour = parts.find((p) => p.type === 'hour')?.value || '00';
    const minute = parts.find((p) => p.type === 'minute')?.value || '00';

    return {
      date: `${day}-${month}-${year}`,
      time: `${hour}:${minute}`,
    };
  } catch {
    // Fallback if Intl timeZone fails
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      date: `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
  }
}

/**
 * Core function to download CSV data in the browser.
 */
export function exportToCSV({ filename, headers, rows }: ExportCsvOptions): void {
  if (typeof window === 'undefined') return;

  const serializedHeader = headers.map(escapeCsvCell).join(',');
  const serializedRows = rows.map((row) => {
    // Ensure every row has exact same column count as headers
    const normalizedRow = headers.map((_, colIdx) => row[colIdx] ?? '');
    return normalizedRow.map(escapeCsvCell).join(',');
  });

  // Prepend UTF-8 BOM (\uFEFF) so Excel, Google Sheets, and mobile viewers correctly identify UTF-8 encoding
  const csvContent = '\uFEFF' + [serializedHeader, ...serializedRows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const cleanFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.href = url;
  link.setAttribute('download', cleanFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Helper to extract invoice ID consistently from an order or inquiry object.
 */
export function extractInvoiceId(inq: any): string {
  if (inq.invoice_id) return inq.invoice_id;
  if (inq.notes) {
    const match = inq.notes.match(/INVOICE_ID:\s*(INV-\d{4}-\w{4,8})/i);
    if (match) return match[1];
  }
  const year = inq.created_at ? new Date(inq.created_at).getFullYear() : new Date().getFullYear();
  return `INV-${year}-${inq.id ? inq.id.substring(0, 5).toUpperCase() : 'POS'}`;
}

/**
 * Helper to extract order source ('ONLINE' or 'OFFLINE').
 */
export function extractSource(inq: any): 'ONLINE' | 'OFFLINE' {
  if (inq.notes) {
    const m = inq.notes.match(/BILL TYPE:\s*(\w+)/i);
    if (m) return m[1].toUpperCase() === 'ONLINE' ? 'ONLINE' : 'OFFLINE';
  }
  if (inq.invoice_id) return 'OFFLINE';
  return 'ONLINE';
}

/**
 * Helper to serialize order items into a clean single string: "Item Name x Qty; Item 2 x Qty".
 */
export function formatOrderItemsSummary(inq: any): string {
  const items = inq.items || inq.order_items || inq.inquiry_items || [];
  if (!Array.isArray(items) || items.length === 0) {
    // Check if custom items exist in notes
    if (inq.notes) {
      const customMatch = inq.notes.match(/Custom Items:\s*([^\n|]*)/i);
      if (customMatch && customMatch[1]) {
        return customMatch[1].trim();
      }
    }
    return 'General Sanitaryware';
  }

  return items
    .map((item: any) => {
      const name = item.product_name || item.name || item.variant?.mattress?.name || 'Item';
      const variant = item.variant?.size_name || item.size_name || '';
      const sku = item.variant?.sku || '';
      const dims = formatDimensions(item.variant?.dimensions || item.dimensions || item.variant, 'mm');
      const qty = item.quantity || 1;
      const clean = cleanDisplayName({
        productName: name,
        sku,
        sizeName: variant,
        dimensions: dims,
      });
      return `${clean.displayName} x ${qty}`;
    })
    .join('; ');
}

/**
 * Specialized high-level exporter for Orders / Inquiries history.
 */
export function exportOrdersToCSV(orders: any[], customFilename?: string): void {
  const headers = [
    'Order ID',
    'Date (DD-MM-YYYY)',
    'Time (IST)',
    'Customer Name',
    'Mobile Number',
    'Source',
    'Items (Name x Qty)',
    'Subtotal (INR)',
    'Delivery Charge (INR)',
    'Total Amount (INR)',
    'Payment Method',
    'Order Status',
  ];

  const rows = orders.map((inq) => {
    const { date, time } = formatIndianDateTime(inq.created_at);
    const invoiceId = extractInvoiceId(inq);
    const source = extractSource(inq);
    const customerName = inq.customer_name || 'Walk-in Customer';
    const mobile = formatPhoneForCsv(inq.customer_phone);
    const itemsSummary = formatOrderItemsSummary(inq);

    // Amounts formatted as clean numeric strings without ₹ symbols for spreadsheet calculation
    const totalAmount = Number(inq.total_amount || 0);
    const deliveryCharge = Number(inq.delivery_charge || 0);
    const discountAmount = Number(inq.discount_amount || 0);

    // Calculate subtotal
    const rawItems = inq.items || inq.order_items || inq.inquiry_items || [];
    let calculatedSubtotal = 0;
    if (Array.isArray(rawItems) && rawItems.length > 0) {
      calculatedSubtotal = rawItems.reduce((acc: number, it: any) => {
        const q = it.quantity || 1;
        const p = it.unit_price ?? it.price ?? 0;
        return acc + (q * p);
      }, 0);
    }

    const finalSubtotal = calculatedSubtotal > 0
      ? calculatedSubtotal
      : (totalAmount - deliveryCharge + discountAmount);

    const paymentMethod =
      inq.payment_method ||
      (inq.notes?.match(/PAYMENT(?:_METHOD)?:\s*(\w+)/i)?.[1]) ||
      (source === 'OFFLINE' ? 'Cash' : 'Online');

    const status = inq.status || (source === 'OFFLINE' ? 'Completed' : 'Pending');

    return [
      formatIdForCsv(invoiceId),
      date,
      time,
      customerName,
      mobile,
      source,
      itemsSummary,
      finalSubtotal.toFixed(2),
      deliveryCharge.toFixed(2),
      totalAmount.toFixed(2),
      paymentMethod,
      status,
    ];
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const filename = customFilename || `abirami-orders-${todayStr}.csv`;

  exportToCSV({
    filename,
    headers,
    rows,
  });
}

/**
 * Specialized high-level exporter for Products catalog.
 */
export function exportProductsToCSV(products: any[], customFilename?: string): void {
  const headers = [
    'Product ID',
    'Product Name',
    'Category',
    'Sub-Category',
    'Selling Price (INR)',
    'MRP (INR)',
    'Variants Count',
    'Stock Status',
  ];

  const rows = products.map((prod) => {
    const minPrice = prod.price || prod.sizes?.[0]?.price || 0;
    const mrp = prod.mrp || prod.sizes?.[0]?.mrp || minPrice;
    const variantsCount = prod.sizes?.length || 0;
    const inStock = prod.inStock !== false ? 'In Stock' : 'Out of Stock';

    return [
      formatIdForCsv(prod.id),
      prod.name || '',
      prod.category || '',
      prod.subCategory || '',
      Number(minPrice).toFixed(2),
      Number(mrp).toFixed(2),
      variantsCount,
      inStock,
    ];
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const filename = customFilename || `abirami-products-${todayStr}.csv`;

  exportToCSV({
    filename,
    headers,
    rows,
  });
}

