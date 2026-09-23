'use client';

import React from 'react';
import { Printer } from 'lucide-react';

export interface BillItem {
  name: string;
  sku?: string;
  quantity: number;
  unit?: string;
  price: number;
  total?: number;
}

export interface BillGeneratedViewProps {
  invoiceId: string;
  grandTotal: number;
  subtotal?: number;
  discountAmount?: number;
  deliveryFee?: number;
  amountReceived?: number;
  balanceReturned?: number;
  items: BillItem[];
  whatsappUrl: string;
  onNewSale: () => void;
  brandTitle?: string;
  billingMode?: 'offline' | 'online';
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  date?: string;
  paymentMode?: string;
}

export default function BillGeneratedView({
  invoiceId,
  grandTotal,
  subtotal,
  discountAmount = 0,
  deliveryFee = 0,
  amountReceived,
  balanceReturned,
  items,
  whatsappUrl,
  onNewSale,
  brandTitle = 'Abirami Agency',
  billingMode = 'offline',
  customerName,
  customerPhone,
  customerAddress,
  date,
  paymentMode,
}: BillGeneratedViewProps) {
  // If amountReceived is undefined or 0, fallback to grandTotal
  const finalReceived =
    amountReceived !== undefined && amountReceived > 0 ? amountReceived : grandTotal;
  const finalBalance =
    balanceReturned !== undefined
      ? balanceReturned
      : Math.max(0, finalReceived - grandTotal);

  const calculatedSubtotal = items.reduce((acc, it) => {
    const line = it.total !== undefined ? it.total : it.price * it.quantity;
    return acc + line;
  }, 0);

  const finalSubtotal = subtotal !== undefined && subtotal > 0 ? subtotal : calculatedSubtotal;

  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleWhatsApp = () => {
    if (whatsappUrl && typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank');
    }
  };

  const cleanInvoiceId = invoiceId.startsWith('#')
    ? invoiceId.substring(1)
    : invoiceId;

  const formattedDate =
    date ||
    new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          SCREEN UI (Hidden when printing via print:hidden)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="w-full max-w-2xl mx-auto py-6 sm:py-10 px-4 sm:px-6 space-y-6 print:hidden">
        {/* Top Brand Bar */}
        <div className="flex justify-between items-center">
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {brandTitle}
          </h1>
          <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-full border border-slate-200">
            <span
              className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all ${
                billingMode === 'offline'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              OFFLINE (POS)
            </span>
            <span
              className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingMode === 'online'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              ONLINE ORDER
            </span>
          </div>
        </div>

        {/* Header Row */}
        <div className="flex justify-between items-start pt-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Bill Generated
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-sky-500 mt-1">
              #{cleanInvoiceId}
            </p>
          </div>
          <button
            type="button"
            onClick={onNewSale}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-4 py-2 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
          >
            + NEW SALE
          </button>
        </div>

        {/* PAYMENT RECEIPT Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            PAYMENT RECEIPT
          </div>

          <div className="flex justify-between items-center text-slate-900">
            <span className="text-base font-semibold text-slate-700">Grand Total</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {formatCurrency(grandTotal)}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span className="text-sm font-medium text-slate-600">Amount Received</span>
            <span className="text-base font-bold text-slate-800">
              {formatCurrency(finalReceived)}
            </span>
          </div>

          {/* Highlighted Row: Balance Returned */}
          <div className="bg-sky-50 rounded-xl p-4 flex justify-between items-center text-blue-600">
            <span className="font-bold text-sm sm:text-base text-blue-700">
              Balance Returned
            </span>
            <span className="font-black text-xl text-blue-700">
              {formatCurrency(finalBalance)}
            </span>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* PRINT RECEIPT */}
          <button
            type="button"
            onClick={handlePrint}
            className="border border-slate-300 text-slate-700 hover:bg-slate-50 py-2.5 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-sky-500 shrink-0" />
            <span>PRINT RECEIPT</span>
          </button>

          {/* WHATSAPP INVOICE */}
          <button
            type="button"
            onClick={handleWhatsApp}
            className="bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.128.552 4.195 1.6 6.02L.031 24l6.108-1.597c1.764.954 3.754 1.458 5.892 1.458 6.646 0 12.031-5.385 12.031-12.031C24 5.385 18.677 0 12.031 0zm0 21.854c-1.802 0-3.568-.485-5.114-1.403l-.367-.217-3.794.994.994-3.794-.217-.367C2.569 15.539 2.083 13.785 2.083 12.031c0-5.498 4.475-9.972 9.948-9.972 5.497 0 9.947 4.474 9.947 9.972s-4.45 9.823-9.947 9.823zm5.45-7.447c-.299-.15-1.765-.87-2.036-.97-.272-.1-.47-.15-.668.15-.2.299-.77 1-.944 1.2-.175.2-.349.225-.648.075-.299-.15-1.26-.464-2.4-1.485-.888-.795-1.487-1.776-1.663-2.075-.175-.3 0-.462.15-.61.135-.135.299-.35.45-.525.15-.174.2-.299.299-.499.1-.2.05-.375-.025-.525-.075-.15-.668-1.611-.914-2.204-.239-.58-.484-.502-.668-.511-.174-.01-.375-.01-.575-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.074 2.898 1.224 3.098c.15.2 2.112 3.22 5.114 4.516.715.309 1.272.493 1.706.63.722.228 1.38.196 1.897.119.58-.087 1.765-.722 2.014-1.42.249-.698.249-1.298.174-1.42-.075-.123-.274-.198-.574-.348z" />
            </svg>
            <span>WHATSAPP INVOICE</span>
          </button>

          {/* + NEW SALE */}
          <button
            type="button"
            onClick={onNewSale}
            className="bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            + NEW SALE
          </button>
        </div>

        {/* ITEMS SOLD Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            ITEMS SOLD
          </div>

          <div className="divide-y divide-slate-100">
            {items.map((item, idx) => {
              const itemTotal =
                item.total !== undefined ? item.total : item.price * item.quantity;
              return (
                <div
                  key={idx}
                  className="py-3 flex justify-between items-center text-sm"
                >
                  <div className="text-slate-800 font-medium">
                    {item.name}{' '}
                    <span className="text-slate-400 font-normal">
                      × {item.quantity} {item.unit || 'piece'}
                    </span>
                  </div>
                  <div className="text-slate-900 font-bold">
                    {formatCurrency(itemTotal)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          PRINT-ONLY DEDICATED INVOICE TEMPLATE (hidden print:block)
      ══════════════════════════════════════════════════════════════════ */}
      <div
        id="printable-receipt"
        className="hidden print:block w-full max-w-[190mm] mx-auto bg-white text-slate-900 font-sans text-xs p-4 leading-normal"
        style={{ pageBreakInside: 'avoid' }}
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

          {/* Receipt Title Divider */}
          <div className="my-2.5 py-1 border-y border-slate-400 text-center font-black tracking-widest text-xs uppercase bg-slate-50">
            RETAIL INVOICE / CASH BILL
          </div>
        </div>

        {/* 2. Invoice Metadata & Customer Information (2-Column Grid) */}
        <div className="grid grid-cols-2 gap-4 pb-2.5 border-b border-slate-300 text-xs">
          {/* Left Column (Billed To) */}
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">
              BILLED TO:
            </span>
            <p className="font-bold text-slate-900 text-sm">
              {customerName || 'Walk-in Customer'}
            </p>
            {customerPhone && (
              <p className="text-slate-700">
                <span className="font-semibold text-slate-500">Phone:</span> {customerPhone}
              </p>
            )}
            {customerAddress && (
              <p className="text-slate-600 leading-snug">
                <span className="font-semibold text-slate-500">Address:</span> {customerAddress}
              </p>
            )}
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
            <p className="text-slate-700">
              <span className="font-semibold text-slate-500">Payment Mode:</span>{' '}
              <span className="font-bold text-slate-900 uppercase">
                {paymentMode || (billingMode === 'online' ? 'Online / UPI' : 'Cash')}
              </span>
            </p>
          </div>
        </div>

        {/* 3. Itemized Product Table (Traditional Accounting Format) */}
        <div className="my-3">
          <table className="w-full border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="w-10 text-center border-r border-slate-300 py-1.5 px-1">
                  S.No
                </th>
                <th className="text-left border-r border-slate-300 py-1.5 px-2.5">
                  Item Description / Model / SKU
                </th>
                <th className="w-16 text-center border-r border-slate-300 py-1.5 px-1">
                  Qty
                </th>
                <th className="w-24 text-right border-r border-slate-300 py-1.5 px-2">
                  Unit Price
                </th>
                <th className="w-28 text-right py-1.5 px-2.5">
                  Total Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, idx) => {
                const itemTotal =
                  item.total !== undefined ? item.total : item.price * item.quantity;
                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="text-center border-r border-slate-300 py-1.5 px-1 font-medium text-slate-600">
                      {idx + 1}
                    </td>
                    <td className="border-r border-slate-300 py-1.5 px-2.5">
                      <span className="font-bold text-slate-900 block leading-tight">
                        {item.name}
                      </span>
                      {item.sku && (
                        <span className="text-[10px] text-slate-500 block">
                          SKU: {item.sku}
                        </span>
                      )}
                    </td>
                    <td className="text-center border-r border-slate-300 py-1.5 px-1 font-semibold text-slate-800">
                      {item.quantity} {item.unit || 'pc'}
                    </td>
                    <td className="text-right border-r border-slate-300 py-1.5 px-2 font-medium text-slate-800">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="text-right py-1.5 px-2.5 font-bold text-slate-900">
                      {formatCurrency(itemTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 4. Financial Totals & Balance Breakdown (Right-Aligned Block) */}
        <div className="flex justify-end my-2">
          <div className="w-64 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600 py-0.5">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">
                {formatCurrency(finalSubtotal)}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold py-0.5">
                <span>Discount Applied:</span>
                <span>- {formatCurrency(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600 py-0.5">
              <span>Delivery / Freight:</span>
              <span className="font-semibold text-slate-800">
                {deliveryFee > 0 ? formatCurrency(deliveryFee) : 'FREE'}
              </span>
            </div>

            {/* Grand Total Double Border */}
            <div className="border-t-2 border-b-2 border-double border-slate-900 py-1 my-1 flex justify-between items-center font-bold text-slate-900">
              <span className="uppercase tracking-wider text-xs">Grand Total:</span>
              <span className="text-sm font-black">{formatCurrency(grandTotal)}</span>
            </div>

            {/* Payment Summary */}
            <div className="pt-0.5 space-y-0.5 text-slate-600 text-[11px]">
              <div className="flex justify-between">
                <span>Amount Received:</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(finalReceived)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Balance Returned:</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(finalBalance)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Footer & Legal Terms */}
        <div className="mt-6 pt-3 border-t border-slate-300 flex justify-between items-end text-xs">
          <div className="max-w-xs text-[10px] text-slate-500 leading-relaxed space-y-0.5">
            <p className="font-bold text-slate-700 uppercase">Terms &amp; Conditions:</p>
            <p>1. Goods once sold will not be taken back without valid bill.</p>
            <p>2. Parryware warranty as per manufacturer standard policy.</p>
            <p className="mt-1 font-bold text-slate-800">Thank you for your business!</p>
          </div>

          <div className="text-center">
            <div className="h-12 border-b border-dashed border-slate-400 w-44 mb-1 mx-auto" />
            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
              Authorised Signatory / Stamp
            </p>
            <p className="text-[9px] text-slate-500 font-medium">For Abirami Agency</p>
          </div>
        </div>
      </div>
    </>
  );
}
