'use client';

import React from 'react';

export interface PrintableReceiptItem {
  name?: string;
  product_name?: string;
  sku?: string;
  quantity: number;
  unit?: string;
  price?: number;
  unit_price?: number;
  total?: number;
}

export interface PrintableReceiptOrder {
  invoiceId?: string;
  invoice_id?: string;
  id?: string;
  date?: string;
  created_at?: string;
  customerName?: string;
  customer_name?: string;
  customerPhone?: string;
  customer_phone?: string;
  customerAddress?: string;
  customer_address?: string;
  address?: string;
  delivery_address?: string;
  customerGstin?: string;
  customer_gstin?: string;
  is_gst?: boolean;
  gstRate?: number;
  gst_rate?: number;
  taxable_amount?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  grandTotal?: number;
  total_amount?: number;
  subtotal?: number;
  discountAmount?: number;
  discount_amount?: number;
  deliveryFee?: number;
  delivery_charge?: number;
  paymentMode?: string;
  payment_method?: string;
  items?: PrintableReceiptItem[];
}

export interface PrintableReceiptProps {
  order: PrintableReceiptOrder;
}

export default function PrintableReceipt({ order }: PrintableReceiptProps) {
  const isGst = Boolean(order.is_gst);
  const gstRate = order.gstRate ?? order.gst_rate ?? 18;
  const halfGstRate = (gstRate / 2).toFixed(1).replace(/\.0$/, '');

  const invoiceId = order.invoiceId || order.invoice_id || order.id || '0000';
  const cleanInvoiceId = invoiceId.startsWith('#') ? invoiceId.substring(1) : invoiceId;

  const rawDate = order.date || order.created_at;
  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

  const grandTotal = order.grandTotal ?? order.total_amount ?? 0;
  const discountAmount = order.discountAmount ?? order.discount_amount ?? 0;
  const deliveryFee = order.deliveryFee ?? order.delivery_charge ?? 0;

  const items = order.items || [];
  const calculatedSubtotal = items.reduce((acc, it) => {
    const qty = it.quantity || 1;
    const price = it.price ?? it.unit_price ?? 0;
    const line = it.total !== undefined ? it.total : price * qty;
    return acc + line;
  }, 0);

  const subtotal = order.subtotal !== undefined && order.subtotal > 0 ? order.subtotal : calculatedSubtotal;

  // Inclusive GST calculations
  const taxableValue = isGst
    ? order.taxable_amount ?? Number((grandTotal / (1 + gstRate / 100)).toFixed(2))
    : grandTotal;
  const totalGst = isGst ? Number((grandTotal - taxableValue).toFixed(2)) : 0;
  const cgst = isGst
    ? order.cgst_amount ?? Number((totalGst / 2).toFixed(2))
    : 0;
  const sgst = isGst
    ? order.sgst_amount ?? Number((totalGst - cgst).toFixed(2))
    : 0;

  const customerName = order.customerName || order.customer_name || 'Walk-in Customer';
  const customerPhone = order.customerPhone || order.customer_phone || '';
  const customerAddress = order.address || order.delivery_address || order.customer_address || order.customerAddress || '';
  const customerGstin = order.customerGstin || order.customer_gstin || '';

  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div
      id="printable-receipt"
      className="w-full max-w-[190mm] mx-auto bg-white text-slate-900 font-sans text-xs p-4 leading-normal mb-0 pb-0"
      style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
    >
      {/* 1. Header (Business & Shop Details) */}
      <div className="text-center pb-2">
        <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950">
          ABIRAMI AGENCY
        </h1>
        <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide mt-0.5">
          Authorised Parryware Wholesaler &amp; Sanitaryware Dealers
        </p>
        <p className="text-[11px] text-slate-600 mt-1">
          Madavaram Red Hills Rd, Kilburn Nagar, Madhavaram, Chennai - 600060
        </p>
        <p className="text-[11px] text-slate-600">
          Phone: +91 86107 10434 / +91 72003 77455 | Tamil Nadu, India
        </p>
        <p className="text-[11px] font-extrabold text-slate-900 mt-0.5 tracking-wider">
          GSTIN: 33AAAAA0000A1Z5
        </p>

        {/* Receipt Title Divider: TAX INVOICE vs RETAIL INVOICE / CASH BILL */}
        <div className="my-2 py-1 border-y-2 border-slate-900 text-center font-black tracking-widest text-xs uppercase bg-slate-50">
          {isGst ? 'TAX INVOICE' : 'RETAIL INVOICE / CASH BILL'}
        </div>
      </div>

      {/* 2. Invoice Metadata & Customer Information (2-Column Grid) */}
      <div className="grid grid-cols-2 gap-4 pb-2 border-b border-slate-300 text-xs">
        {/* Left Column (Billed To) */}
        <div className="space-y-0.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">
            BILLED TO:
          </span>
          <p className="font-bold text-slate-900 text-sm">
            {customerName}
          </p>
          {customerPhone ? (
            <p className="text-slate-700">
              <span className="font-semibold text-slate-500">Phone:</span> {customerPhone}
            </p>
          ) : null}
          {customerAddress ? (
            <p className="text-slate-700 leading-snug">
              <span className="font-semibold text-slate-500">Address:</span> {customerAddress}
            </p>
          ) : null}
          {customerGstin ? (
            <p className="text-slate-900 font-bold leading-snug">
              <span className="font-semibold text-slate-500">GSTIN:</span> {customerGstin}
            </p>
          ) : null}
        </div>

        {/* Right Column (Invoice Details) */}
        <div className="text-right space-y-0.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">
            INVOICE DETAILS:
          </span>
          <p className="text-slate-700">
            <span className="font-semibold text-slate-500">Invoice No:</span>{' '}
            <span className="font-black text-slate-900">#{cleanInvoiceId}</span>
          </p>
          <p className="text-slate-700">
            <span className="font-semibold text-slate-500">Date &amp; Time:</span>{' '}
            <span className="font-medium text-slate-900">{formattedDate}</span>
          </p>
          {(order.paymentMode || order.payment_method) && (
            <p className="text-slate-700">
              <span className="font-semibold text-slate-500">Payment Mode:</span>{' '}
              <span className="font-bold text-slate-900">{order.paymentMode || order.payment_method}</span>
            </p>
          )}
          {isGst && (
            <p className="text-slate-700 text-[11px]">
              <span className="font-semibold text-slate-500">GST Type:</span>{' '}
              <span className="font-bold text-slate-900">Intra-State (CGST + SGST)</span>
            </p>
          )}
        </div>
      </div>

      {/* 3. Itemized Product Table */}
      <div className="my-2.5">
        <table className="w-full border-collapse border border-slate-300 text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
              <th className="w-8 text-center border-r border-slate-300 py-1 px-1">
                S.No
              </th>
              <th className="text-left border-r border-slate-300 py-1 px-2">
                Item Description / Model / SKU
              </th>
              <th className="w-14 text-center border-r border-slate-300 py-1 px-1">
                Qty
              </th>
              <th className="w-20 text-right border-r border-slate-300 py-1 px-2">
                Unit Price
              </th>
              <th className="w-24 text-right py-1 px-2">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item, idx) => {
              const name = item.name || item.product_name || 'Product';
              const price = item.price ?? item.unit_price ?? 0;
              const qty = item.quantity || 1;
              const itemTotal = item.total !== undefined ? item.total : price * qty;
              return (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="text-center border-r border-slate-300 py-1 px-1 font-medium text-slate-600">
                    {idx + 1}
                  </td>
                  <td className="border-r border-slate-300 py-1 px-2">
                    <span className="font-bold text-slate-900 block leading-tight">
                      {name}
                    </span>
                    {item.sku && (
                      <span className="text-[10px] text-slate-500 block">
                        SKU: {item.sku}
                      </span>
                    )}
                  </td>
                  <td className="text-center border-r border-slate-300 py-1 px-1 font-semibold text-slate-800">
                    {qty} {item.unit || 'pc'}
                  </td>
                  <td className="text-right border-r border-slate-300 py-1 px-2 font-medium text-slate-800">
                    {formatCurrency(price)}
                  </td>
                  <td className="text-right py-1 px-2 font-bold text-slate-900">
                    {formatCurrency(itemTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 4. Financial Totals & Tax Breakdown (Bottom Right) */}
      <div className="flex justify-end my-2">
        <div className="w-72 space-y-1 text-xs">
          {isGst ? (
            <>
              {/* GST Tax Breakdown */}
              <div className="flex justify-between text-slate-700 py-0.5">
                <span>Subtotal (Taxable Value):</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(taxableValue)}
                </span>
              </div>

              <div className="flex justify-between text-slate-600 py-0.5">
                <span>CGST @ {halfGstRate}%:</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(cgst)}
                </span>
              </div>

              <div className="flex justify-between text-slate-600 py-0.5">
                <span>SGST @ {halfGstRate}%:</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(sgst)}
                </span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-slate-600 py-0.5">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">
                {formatCurrency(subtotal)}
              </span>
            </div>
          )}

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold py-0.5">
              <span>Discount Applied:</span>
              <span>- {formatCurrency(discountAmount)}</span>
            </div>
          )}

          {deliveryFee > 0 && (
            <div className="flex justify-between text-slate-600 py-0.5">
              <span>Delivery / Freight:</span>
              <span className="font-semibold text-slate-800">
                {formatCurrency(deliveryFee)}
              </span>
            </div>
          )}

          {/* Total Amount Double Border */}
          <div className="border-t-2 border-b-2 border-double border-slate-900 py-1 my-1 flex justify-between items-center font-bold text-slate-900">
            <span className="uppercase tracking-wider text-xs">
              {isGst ? 'Total Amount (Incl. GST):' : 'Total Amount:'}
            </span>
            <span className="text-sm font-black">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* 5. Footer & Legal Terms */}
      <div className="mt-4 pt-2 border-t border-slate-300 flex justify-between items-end text-xs mb-0 pb-0">
        <div className="max-w-xs text-[10px] text-slate-500 leading-relaxed space-y-0.5">
          <p className="font-bold text-slate-700 uppercase">Terms &amp; Conditions:</p>
          <p>1. Goods once sold will not be taken back without valid bill.</p>
          <p>2. Parryware warranty as per manufacturer standard policy.</p>
          <p className="mt-0.5 font-bold text-slate-800">Thank you for your business!</p>
        </div>

        <div className="text-center">
          <div className="h-10 border-b border-dashed border-slate-400 w-40 mb-1 mx-auto" />
          <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
            Authorised Signatory / Stamp
          </p>
          <p className="text-[9px] text-slate-500 font-medium">For Abirami Agency</p>
        </div>
      </div>
    </div>
  );
}
