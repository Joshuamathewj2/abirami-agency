"use client";

import { useEffect, useState, use } from "react";
import { getInvoiceAction } from "@/app/actions/orderActions";
import { ShoppingBag, MapPin, Phone, Printer, Copy, Check } from "lucide-react";
import Link from "next/link";

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      const result = await getInvoiceAction(id);

      if (!result.success || !result.data) {
        setError(true);
      } else {
        setOrder(result.data);
        document.title = `Invoice - ${result.data.invoice_id || result.data.id}`;
      }
      setLoading(false);
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-[#DA2128] rounded-full flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <p className="text-gray-600 font-bold tracking-widest uppercase text-sm">Generating Digital Bill...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-[#DA2128] font-bold text-xl">Invoice Not Found</p>
        <Link href="/admin/orders" className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-900 font-bold transition-colors">
          Return to Orders
        </Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const discountAmount = order.discount_amount || 0;
  const totalAmount = order.total_amount || 0;
  const subtotal = totalAmount + discountAmount;

  // Parser helper to extract custom items from notes safely
  const parseCustomItems = (notes: string, hasDbItems: boolean) => {
    if (!notes) return [];
    const items: any[] = [];
    
    // 1. Parse "Custom Items: ..."
    const customItemsMatch = notes.match(/Custom Items:\s*([^\n|]*)/i);
    if (customItemsMatch) {
      const itemsStr = customItemsMatch[1].trim();
      const parts = itemsStr.split(/,\s*(?=[^()]*\((?:Qty|Qty:)\s*\d+\))/);
      parts.forEach(part => {
        const qtyMatch = part.match(/\((?:Qty|Qty:)\s*(\d+)\)/i);
        const priceMatch = part.match(/@\s*₹?\s*([\d.]+)/i);
        if (qtyMatch) {
          const qty = parseInt(qtyMatch[1], 10);
          let name = part.replace(qtyMatch[0], "");
          if (priceMatch) {
            name = name.replace(priceMatch[0], "");
          }
          name = name.replace(/@\s*$/, "").trim();
          const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
          items.push({ quantity: qty, unit_price: price, custom_name: name });
        }
      });
      if (items.length > 0) return items;
    }

    // 2. Fallback to parse WhatsApp template
    if (!hasDbItems && (notes.includes("Items Ordered:") || notes.includes("ITEMS ORDERED:") || notes.includes("*Items:*"))) {
      const lines = notes.split("\n");
      let inItemsSection = false;
      let currentItem: any = null;
      for (let line of lines) {
        line = line.trim();
        if (line.match(/Items Ordered:/i)) {
          inItemsSection = true;
          continue;
        }
        if (inItemsSection && (line.match(/Subtotal:/i) || line.match(/Total Amount:/i) || line.match(/Thank you/i))) {
          if (currentItem) items.push(currentItem);
          currentItem = null;
          inItemsSection = false;
          break;
        }
        if (inItemsSection) {
          const itemStartMatch = line.match(/^(?:[📦\s]*\d+\.\s*)(.*)/);
          if (itemStartMatch) {
            if (currentItem) items.push(currentItem);
            currentItem = { custom_name: itemStartMatch[1].trim(), quantity: 1, unit_price: 0 };
            continue;
          }
          if (currentItem) {
            const qtyMatch = line.match(/(?:Qty|Qty:)\s*(\d+)/i);
            const priceMatch = line.match(/(?:💵|₹)\s*([\d,.]+)/i);
            if (qtyMatch) currentItem.quantity = parseInt(qtyMatch[1], 10);
            if (priceMatch) currentItem.unit_price = parseFloat(priceMatch[1].replace(/,/g, ''));

            const format2Match = line.match(/\(x(\d+)\)\s*-\s*₹?\s*([\d,.]+)/i);
            if (format2Match) {
              currentItem.quantity = parseInt(format2Match[1], 10);
              currentItem.unit_price = parseFloat(format2Match[2].replace(/,/g, ''));
              const details = line.replace(format2Match[0], "").trim();
              if (details) currentItem.custom_name = `${currentItem.custom_name} ${details}`;
            }
          }
        }
      }
      if (currentItem) items.push(currentItem);
    }
    return items;
  };

  // Helper to filter out autogenerated/metadata notes
  const getDisplayNotes = (notes: string) => {
    if (!notes) return "";
    const lowerNotes = notes.toLowerCase();
    
    // If it is the autogenerated POS invoice text, ignore it entirely
    // If it is the autogenerated POS invoice text, ignore it entirely
    if (lowerNotes.includes("invoice from abirami agency")) {
      return "";
    }
    
    // Otherwise, clean up any invoice ID and bill type metadata tags
    const cleaned = notes
      .replace(/bill type:\s*\w+/i, "")
      .replace(/invoice_id:\s*inv-\d{4}-\w{4,8}/i, "")
      .replace(/selected colors:\s*.*?(?=\||$)/i, "")
      .replace(/custom items:\s*.*?(?=\||$)/i, "")
      .replace(/^[|]+|[|]+$/g, "") // remove leading/trailing pipe symbols
      .replace(/\|+/g, "\n") // replace remaining pipes with newlines
      .trim();
      
    return cleaned;
  };

  const dbItems = order.order_items || [];
  const customItems = parseCustomItems(order.notes, dbItems.length > 0);

  // Merge items safely preventing duplicates
  const allItems = [...dbItems];
  customItems.forEach((cItem: any) => {
    const isDuplicate = dbItems.some((dbItem: any) => {
      const dbProdName = dbItem.variants?.mattresses?.name || "";
      const dbSize = dbItem.variants?.size_name || "";
      const dbFullName = `${dbProdName} ${dbSize}`.toLowerCase();
      const cName = cItem.custom_name.toLowerCase();
      return dbFullName.includes(cName) || cName.includes(dbFullName);
    });
    if (!isDuplicate) {
      allItems.push(cItem);
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans py-12 px-4 print:p-0 print:bg-white flex flex-col items-center">
      <style>{`
        @media print {
          @page {
            margin: 5mm;
          }
          body {
            background-color: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            zoom: 0.92;
          }
        }
      `}</style>
      
      {/* Top Navigation / Action Bar (Hidden when printing) */}
      <div className="w-full max-w-3xl flex justify-end items-center mb-8 print:hidden gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleCopyLink}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 hover:text-primary font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg shadow-sm border border-gray-200 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy Link
              </>
            )}
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider px-5 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Download PDF / Print
          </button>
        </div>
      </div>

      {/* The Invoice Document */}
      <div className="w-full max-w-3xl bg-white border border-gray-200 rounded-2xl shadow-xl print:shadow-none print:border-none print:rounded-none overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-[#f0f9ff] border-b border-gray-200 p-8 sm:p-12 print:p-4 flex flex-col items-center text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Abirami Agency</h1>
          <p className="text-xs text-primary font-bold tracking-wider mt-2 mb-4">INVOICE: {order.invoice_id || order.id}</p>
          
          <div className="flex flex-col items-center gap-2 text-sm text-gray-600 font-semibold">
            <div className="text-center w-full leading-relaxed">
              <span className="inline-block text-primary mr-1.5 align-middle -mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
              </span>
              <span>1 A, Madhavaram High Rd, next to SBI Bank, KKR Nagar, KKR Garden, Madhavaram, Chennai, Greater Chennai, Tamil Nadu 600060</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center">
              <Phone className="w-3.5 h-3.5 text-[#DA2128] shrink-0" />
              <span>+91 {process.env.NEXT_PUBLIC_STORE_PHONE || "72003 77455"}</span>
            </div>
          </div>
        </div>

        {/* Invoice Meta Data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 p-8 sm:p-12 print:p-4 print:gap-4 border-b border-gray-100">
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">Billed To</h3>
            <p className="text-base font-bold text-gray-900">{order.customer_name || "Guest Customer"}</p>
            {order.customer_phone && (
              <p className="text-sm text-gray-600 font-semibold mt-1">+91 {order.customer_phone}</p>
            )}
          </div>
          <div className="sm:text-right flex flex-col sm:items-end">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3 self-start sm:self-auto">Order Details</h3>
            <div className="inline-block text-left text-sm">
              <div className="flex flex-wrap gap-x-4 gap-y-1 justify-start sm:justify-end">
                <div className="flex gap-1.5">
                  <span className="text-gray-400 font-bold">Date:</span>
                  <span className="text-gray-900 font-black">{new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex gap-1.5">
                  <span className="text-gray-400 font-bold">Time:</span>
                  <span className="text-gray-900 font-black">{new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex gap-1.5">
                  <span className="text-gray-400 font-bold">Status:</span>
                  <span className="text-gray-900 font-black uppercase">{order.status || 'SALE'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="p-8 sm:p-12 print:py-2 print:px-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Item Description</th>
                <th className="py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Qty</th>
                <th className="py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Price</th>
                <th className="py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allItems.map((item: any, index: number) => {
                let fullName = "";
                let dimensions = "";
                let sku = "";
                
                if (item.variants) {
                  const productName = item.variants?.mattresses?.name || "Unknown Product";
                  const sizeName = item.variants?.size_name || "";
                  fullName = `${productName} ${sizeName ? `(${sizeName})` : ''}`.trim();
                  const length = item.variants?.length;
                  const width = item.variants?.width;
                  const height = item.variants?.height;
                  if (length && width) {
                    dimensions = `${length}" × ${width}"${height ? ` × ${height}"` : ''}`;
                  }
                  sku = item.variants?.sku;
                } else {
                  fullName = item.custom_name || "Custom Product";
                  // Extract dimensions in parenthesis if present
                  const dimMatch = fullName.match(/\(([^)]*\d+["\s]*[×x*][^)]*)\)/i);
                  if (dimMatch) {
                    dimensions = dimMatch[1];
                    fullName = fullName.replace(dimMatch[0], "").trim();
                  }
                }
                
                return (
                  <tr key={index} className="group">
                    <td className="py-6 pr-4 print:py-3">
                      <p className="text-sm font-bold text-gray-900">{fullName}</p>
                      {(dimensions || sku) && (
                        <div className="text-xs text-gray-500 mt-1 space-y-0.5 font-medium">
                          {dimensions && (
                            <p>Dimensions: {dimensions}</p>
                          )}
                          {sku && <p>SKU: {sku}</p>}
                        </div>
                      )}
                    </td>
                    <td className="py-6 px-4 print:py-3 text-center text-sm font-bold text-gray-600">{item.quantity}</td>
                    <td className="py-6 pl-4 print:py-3 text-right text-sm font-bold text-gray-600">₹{item.unit_price.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td className="py-6 pl-4 print:py-3 text-right text-sm font-black text-gray-900">₹{(item.unit_price * item.quantity).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Notes/Comments Section if present */}
        {(() => {
          const notesText = getDisplayNotes(order.notes);
          if (notesText && notesText !== "|" && notesText !== "||") {
            return (
              <div className="mx-8 sm:mx-12 p-5 bg-gray-50 rounded-xl border border-gray-100 mb-8">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Order Notes / Specifications</h4>
                <p className="text-xs font-semibold text-gray-700 whitespace-pre-line leading-relaxed">{notesText}</p>
              </div>
            );
          }
          return null;
        })()}

        {/* Totals Section */}
        <div className="bg-[#fdfaf9] border-t border-gray-200 p-8 sm:p-12 print:p-4 flex justify-end">
            <div className="w-full sm:w-1/2 space-y-3">
              {(discountAmount > 0) && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-bold uppercase tracking-wider">Subtotal</span>
                  <span className="font-bold text-gray-900">₹{subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
              )}
              
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-bold uppercase tracking-wider">
                    Discount
                  </span>
                  <span className="font-bold text-primary">-₹{discountAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4 mt-2 flex justify-between items-center">
                <span className="text-sm font-black text-primary uppercase tracking-widest">Total Amount</span>
                <span className="text-3xl font-black text-gray-900">₹{totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
              </div>
            </div>
        </div>
        
        {/* Footer */}
        <div className="border-t border-gray-100 p-6 print:p-2 text-center bg-gray-50 flex flex-col items-center justify-center gap-1.5">
          <p className="text-xs font-bold text-primary tracking-wider uppercase">Thank you for shopping!</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em]">Abirami Agency</p>
        </div>

      </div>
    </div>
  );
}
