'use client';

import React, { useState } from 'react';
import { Printer } from 'lucide-react';

import PrintableReceipt, { PrintableReceiptOrder } from '@/components/PrintableReceipt';

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
  onSourceChange?: (source: 'offline' | 'online') => void;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  address?: string;
  date?: string;
  paymentMode?: string;
  isGst?: boolean;
  is_gst?: boolean;
  gstRate?: number;
  gst_rate?: number;
  taxableAmount?: number;
  taxable_amount?: number;
  cgstAmount?: number;
  cgst_amount?: number;
  sgstAmount?: number;
  sgst_amount?: number;
  customerGstin?: string;
  customer_gstin?: string;
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
  onSourceChange,
  customerName,
  customerPhone,
  customerAddress,
  address,
  date,
  paymentMode,
  isGst,
  is_gst,
  gstRate,
  gst_rate,
  taxableAmount,
  taxable_amount,
  cgstAmount,
  cgst_amount,
  sgstAmount,
  sgst_amount,
  customerGstin,
  customer_gstin,
}: BillGeneratedViewProps) {
  // Interactive reactive source toggle (defaults to 'offline' for POS, 'online' for Cart)
  const [orderSource, setOrderSource] = useState<'offline' | 'online'>(
    billingMode || 'offline'
  );

  const handleSourceToggle = (source: 'offline' | 'online') => {
    setOrderSource(source);
    if (onSourceChange) {
      onSourceChange(source);
    }
  };

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
        {/* Top Brand Bar with Interactive OFFLINE (POS) / ONLINE ORDER Toggle */}
        <div className="flex justify-between items-center">
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {brandTitle}
          </h1>
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-full border border-slate-200">
            {/* OFFLINE (POS) Button */}
            <button
              type="button"
              onClick={() => handleSourceToggle('offline')}
              className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                orderSource === 'offline'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              OFFLINE (POS)
            </button>

            {/* ONLINE ORDER Button */}
            <button
              type="button"
              onClick={() => handleSourceToggle('online')}
              className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                orderSource === 'online'
                  ? 'bg-emerald-500 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full inline-block ${
                  orderSource === 'online' ? 'bg-white' : 'bg-emerald-500'
                }`}
              />
              ONLINE ORDER
            </button>
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

        {/* BILL SUMMARY Card (Simplified Unpaid Order Display) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            BILL SUMMARY
          </div>

          <div className="flex justify-between items-center text-slate-900">
            <span className="text-base font-bold text-slate-700">Total Amount</span>
            <span className="text-2xl font-black text-slate-900">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>

        {/* Action Buttons Row (Retained intact) */}
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
      <div className="hidden print:block w-full">
        <PrintableReceipt
          order={{
            invoiceId: cleanInvoiceId,
            date: formattedDate,
            grandTotal,
            subtotal: finalSubtotal,
            discountAmount,
            deliveryFee,
            items,
            customerName: customerName || 'Walk-in Customer',
            customerPhone: customerPhone || '',
            customerAddress: customerAddress || address || '',
            address: address || customerAddress || '',
            customerGstin: customerGstin || customer_gstin || '',
            is_gst: isGst ?? is_gst ?? false,
            gstRate: gstRate ?? gst_rate ?? 18,
            taxable_amount: taxableAmount ?? taxable_amount,
            cgst_amount: cgstAmount ?? cgst_amount,
            sgst_amount: sgstAmount ?? sgst_amount,
            paymentMode,
          }}
        />
      </div>
    </>
  );
}
