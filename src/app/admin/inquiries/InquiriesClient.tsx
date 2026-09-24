'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { deleteOrderAction } from '@/app/actions/orderActions';
import { useRouter } from 'next/navigation';

type PeriodFilter = 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_YEAR';

export default function InquiriesClient({ initialInquiries = [] }: { initialInquiries: any[] }) {
  const router = useRouter();

  // Orders local state
  const [orders, setOrders] = useState<any[]>(initialInquiries);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setOrders(initialInquiries);
  }, [initialInquiries]);

  // Period filter state
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Multi-field filter state
  const [searchOrderId, setSearchOrderId] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [sourceFilter, setSourceFilter] = useState('All Sources');

  // Modal state
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const extractInvoiceId = (inq: any) => {
    if (inq.invoice_id) return inq.invoice_id;
    if (inq.notes) {
      const match = inq.notes.match(/INVOICE_ID:\s*(INV-\d{4}-\w{4,8})/i);
      if (match) return match[1];
    }
    const year = inq.created_at ? new Date(inq.created_at).getFullYear() : new Date().getFullYear();
    return `INV-${year}-${inq.id?.substring(0, 5).toUpperCase()}`;
  };

  const extractSource = (inq: any): 'ONLINE' | 'OFFLINE' => {
    if (inq.notes) {
      const m = inq.notes.match(/BILL TYPE:\s*(\w+)/i);
      if (m) return m[1].toUpperCase() === 'ONLINE' ? 'ONLINE' : 'OFFLINE';
    }
    // orders placed via POS BillingClient are offline; inquiries from website are online
    if (inq.invoice_id) return 'OFFLINE';
    return 'ONLINE';
  };

  const formatDateLine = (isoString: string) => {
    if (!isoString) return { date: '-', time: '' };
    const d = new Date(isoString);
    const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return { date, time };
  };

  const formatDateTimeFull = (isoString?: string) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  // ── Period filtering ─────────────────────────────────────────────────────────

  const isInPeriod = (isoString: string) => {
    const d = new Date(isoString);
    const now = new Date();

    if (fromDate || toDate) {
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;
      if (from && d < from) return false;
      if (to) {
        const toEnd = new Date(to);
        toEnd.setHours(23, 59, 59, 999);
        if (d > toEnd) return false;
      }
      return true;
    }

    switch (periodFilter) {
      case 'TODAY': {
        return d.toDateString() === now.toDateString();
      }
      case 'THIS_WEEK': {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return d >= startOfWeek;
      }
      case 'THIS_MONTH': {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      case 'THIS_YEAR': {
        return d.getFullYear() === now.getFullYear();
      }
      default:
        return true;
    }
  };

  // ── Computed filtered list ───────────────────────────────────────────────────

  const filteredInquiries = useMemo(() => {
    return orders.filter((inq) => {
      // Period / date range
      if (inq.created_at && !isInPeriod(inq.created_at)) return false;

      // Order ID
      if (searchOrderId.trim()) {
        const inv = extractInvoiceId(inq).toLowerCase();
        if (!inv.includes(searchOrderId.toLowerCase())) return false;
      }

      // Customer name
      if (searchName.trim()) {
        if (!inq.customer_name?.toLowerCase().includes(searchName.toLowerCase())) return false;
      }

      // Customer phone
      if (searchPhone.trim()) {
        if (!inq.customer_phone?.includes(searchPhone.trim())) return false;
      }

      // Source
      if (sourceFilter !== 'All Sources') {
        if (extractSource(inq) !== sourceFilter) return false;
      }

      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, periodFilter, fromDate, toDate, searchOrderId, searchName, searchPhone, sourceFilter]);

  // ── CSV Export ───────────────────────────────────────────────────────────────

  const handleExportCSV = () => {
    const headers = ['ORDER ID', 'DATE', 'TIME', 'CUSTOMER NAME', 'MOBILE NUMBER', 'SOURCE', 'TOTAL DUE', 'STATUS'];
    const rows = filteredInquiries.map((inq) => {
      const { date, time } = formatDateLine(inq.created_at);
      return [
        extractInvoiceId(inq),
        date,
        time,
        inq.customer_name || '-',
        inq.customer_phone || '-',
        extractSource(inq),
        `₹${(inq.total_amount || 0).toLocaleString('en-IN')}.00`,
        inq.status || 'Pending',
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleOpenDetails = (inq: any) => {
    setSelectedInquiry(inq);
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) return;
    setDeletingId(orderId);
    try {
      const res = await deleteOrderAction(orderId);
      if (res.success) {
        setOrders((prev) => prev.filter((order) => order.id !== orderId));
        router.refresh();
      } else {
        console.error("Delete order failed:", res.error);
        alert(res.error || "Failed to delete order");
      }
    } catch (err: any) {
      console.error("Delete order failed:", err);
      alert(err?.message || "Failed to delete order");
    } finally {
      setDeletingId(null);
    }
  };

  const periodLabels: { key: PeriodFilter; label: string }[] = [
    { key: 'ALL', label: 'ALL TIME' },
    { key: 'TODAY', label: 'TODAY' },
    { key: 'THIS_WEEK', label: 'THIS WEEK' },
    { key: 'THIS_MONTH', label: 'THIS MONTH' },
    { key: 'THIS_YEAR', label: 'THIS YEAR' },
  ];

  return (
    <div className="space-y-5 max-w-[1700px] mx-auto pb-8">

      {/* ── Header + Period Filter Bar ─────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
            Order History
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-0.5">
            Manage and track past invoices
          </p>
        </div>

        {/* Period filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest shrink-0">PERIOD:</span>
          {periodLabels.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setPeriodFilter(key); setFromDate(''); setToDate(''); }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                periodFilter === key && !fromDate && !toDate
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}

          <div className="flex items-center gap-1.5 ml-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase">FROM:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPeriodFilter('ALL'); }}
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase">TO:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPeriodFilter('ALL'); }}
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm cursor-pointer ml-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Multi-field filter card ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Search Order ID */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
              Search Order ID
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value)}
                placeholder="e.g. INV-..."
                className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white transition-all"
              />
              <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
              Customer Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Search name..."
                className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white transition-all"
              />
              <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>

          {/* Customer Phone */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
              Customer Phone
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder="Search phone..."
                className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white transition-all"
              />
              <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
          </div>

          {/* Order Source */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
              Order Source
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white transition-all cursor-pointer"
            >
              <option>All Sources</option>
              <option value="ONLINE">ONLINE</option>
              <option value="OFFLINE">OFFLINE</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/60">
              <th className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3 px-4 border-b border-slate-200">ORDER ID</th>
              <th className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3 px-4 border-b border-slate-200">DATE &amp; TIME</th>
              <th className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3 px-4 border-b border-slate-200">CUSTOMER NAME</th>
              <th className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3 px-4 border-b border-slate-200">MOBILE NUMBER</th>
              <th className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3 px-4 border-b border-slate-200">SOURCE</th>
              <th className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3 px-4 border-b border-slate-200">TOTAL DUE</th>
              <th className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3 px-4 border-b border-slate-200">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs font-medium">
            {filteredInquiries.length > 0 ? (
              filteredInquiries.map((inq: any) => {
                const invoiceId = extractInvoiceId(inq);
                const source = extractSource(inq);
                const totalAmt = inq.total_amount || 0;
                const { date, time } = formatDateLine(inq.created_at);
                const cleanPhone = (inq.customer_phone || '').replace(/[^0-9]/g, '');

                return (
                  <tr key={inq.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* ORDER ID */}
                    <td className="py-3 px-4 border-b border-slate-100 align-middle">
                      <span className="text-xs font-semibold text-blue-600 tracking-tight font-mono">{invoiceId}</span>
                    </td>

                    {/* DATE & TIME */}
                    <td className="py-3 px-4 border-b border-slate-100 align-middle whitespace-nowrap">
                      <span className="block text-xs font-normal text-slate-600 leading-tight">{date}</span>
                      <span className="block text-[11px] text-slate-400 leading-tight mt-0.5">{time}</span>
                    </td>

                    {/* CUSTOMER NAME */}
                    <td className="py-3 px-4 border-b border-slate-100 align-middle text-xs font-bold text-slate-900 tracking-wide uppercase">
                      {inq.customer_name || '-'}
                    </td>

                    {/* MOBILE NUMBER */}
                    <td className="py-3 px-4 border-b border-slate-100 align-middle text-xs font-normal text-slate-600 tabular-nums">
                      {inq.customer_phone || '-'}
                    </td>

                    {/* SOURCE badge */}
                    <td className="py-3 px-4 border-b border-slate-100 align-middle">
                      <span className={`inline-flex items-center text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${
                        source === 'ONLINE'
                          ? 'border-cyan-300 text-cyan-700 bg-cyan-50'
                          : 'border-rose-300 text-rose-700 bg-rose-50'
                      }`}>
                        {source}
                      </span>
                    </td>

                    {/* TOTAL DUE */}
                    <td className="py-3 px-4 border-b border-slate-100 align-middle text-xs font-bold text-slate-900">
                      ₹{Math.round(totalAmt).toLocaleString('en-IN')}
                    </td>

                    {/* ACTIONS */}
                    <td className="py-3 px-4 border-b border-slate-100 align-middle">
                      <div className="flex items-center gap-1.5 flex-nowrap">
                        {/* WhatsApp */}
                        <a
                          href={`https://wa.me/${cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-500 hover:bg-emerald-600 text-white py-1 px-2.5 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer"
                          title="Open WhatsApp"
                        >
                          WhatsApp
                        </a>

                        {/* Invoice */}
                        <Link
                          href={`/invoice/${inq.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-cyan-500 hover:bg-cyan-600 text-white py-1 px-2.5 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap"
                          title="View Invoice"
                        >
                          Invoice
                        </Link>

                        {/* DETAILS */}
                        <button
                          onClick={() => handleOpenDetails(inq)}
                          className="border border-slate-300 text-slate-700 hover:bg-slate-50 py-1 px-2.5 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer"
                          title="Order Details"
                        >
                          DETAILS
                        </button>

                        {/* DELETE */}
                        <button
                          disabled={deletingId === inq.id}
                          onClick={() => handleDelete(inq.id)}
                          className="border border-rose-300 text-rose-600 hover:bg-rose-50 py-1 px-2.5 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
                          title="Delete Order Permanently"
                        >
                          {deletingId === inq.id ? 'Deleting...' : 'DELETE'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-400 font-bold">
                  No orders found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Footer count */}
        {filteredInquiries.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Showing {filteredInquiries.length} of {orders.length} orders
          </div>
        )}
      </div>

      {/* ── Order Details Modal ──────────────────────────────────────────────── */}
      {selectedInquiry && (() => {
        const items = selectedInquiry.items || selectedInquiry.order_items || selectedInquiry.inquiry_items || [];
        const calculatedSubtotal = items.reduce((sum: number, it: any) => {
          const q = it.quantity || 1;
          const p = it.unit_price ?? it.price ?? 0;
          return sum + (q * p);
        }, 0);
        const subtotalAmount = calculatedSubtotal > 0 ? calculatedSubtotal : (selectedInquiry.total_amount || 0);
        const grandTotal = selectedInquiry.total_amount != null && selectedInquiry.total_amount > 0
          ? selectedInquiry.total_amount
          : subtotalAmount;

        return (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedInquiry(null)}
          >
            <div
              className="bg-white rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">Order Details</h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    {extractInvoiceId(selectedInquiry)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Customer & Metadata Grid (Flat 2-column) */}
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 pt-5">
                {/* Top Left: CUSTOMER NAME */}
                <div>
                  <span className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    CUSTOMER NAME
                  </span>
                  <p className="font-medium text-slate-900">
                    {selectedInquiry.customer_name || '-'}
                  </p>
                </div>

                {/* Top Right: CONTACT NUMBER */}
                <div>
                  <span className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    CONTACT NUMBER
                  </span>
                  <p className="font-medium text-slate-900">
                    {selectedInquiry.customer_phone || '-'}
                  </p>
                </div>

                {/* Bottom Left: ORDER SOURCE */}
                <div>
                  <span className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    ORDER SOURCE
                  </span>
                  <p className="font-medium text-slate-900">
                    {extractSource(selectedInquiry)}
                  </p>
                </div>

                {/* Bottom Right: DATE & TIME */}
                <div>
                  <span className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    DATE &amp; TIME
                  </span>
                  <p className="font-medium text-slate-900">
                    {formatDateTimeFull(selectedInquiry.created_at)}
                  </p>
                </div>
              </div>

              {/* Order Items Section */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold tracking-wide uppercase text-slate-700 mb-3">
                  ORDER ITEMS
                </h4>

                {items.length > 0 ? (
                  <div className="space-y-3">
                    {items.map((item: any, idx: number) => {
                      const productName = item.product_name || item.name || item.variant?.mattress?.name || 'Sanitaryware Product';
                      const variantDesc = item.variant?.size_name || item.category || item.notes || 'Wholesale / Standard';
                      const qty = item.quantity || 1;
                      const unitPrice = item.unit_price ?? item.price ?? 0;
                      const lineTotal = qty * unitPrice;

                      return (
                        <div key={item.id || idx} className="flex justify-between items-start gap-4">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-sm leading-snug">
                              {productName}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {variantDesc}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-semibold text-slate-900 text-sm">
                              ₹{lineTotal.toLocaleString('en-IN')}.00
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {qty} x ₹{unitPrice.toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No items listed for this order.</p>
                )}
              </div>

              {/* Order Summary Footer */}
              <div className="border-t border-slate-200 mt-6 pt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Subtotal</span>
                  <span className="text-sm font-semibold text-slate-900">
                    ₹{subtotalAmount.toLocaleString('en-IN')}.00
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-black text-slate-900 tracking-wide text-base">TOTAL</span>
                  <span className="text-cyan-500 font-extrabold text-xl">
                    ₹{grandTotal.toLocaleString('en-IN')}.00
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
