'use client';

import { useState } from 'react';
import Link from 'next/link';
import { updateInquiryStatusAction } from '@/app/actions/orderActions';
import { useRouter } from 'next/navigation';

export default function InquiriesClient({ initialInquiries = [] }: { initialInquiries: any[] }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const getCleanAddress = (notes: string) => {
    if (!notes) return 'No Address Provided';
    return notes
      .replace(/INVOICE_ID:\s*(INV-\d{4}-\w{4,8})/gi, '')
      .replace(/BILL TYPE:\s*\w+/gi, '')
      .trim();
  };

  const extractInvoiceId = (inq: any) => {
    if (inq.invoice_id) return inq.invoice_id;
    if (inq.notes) {
      const match = inq.notes.match(/INVOICE_ID:\s*(INV-\d{4}-\w{4,8})/i);
      if (match) return match[1];
    }
    return `INV-${inq.id?.substring(0, 8).toUpperCase()}`;
  };

  const extractBillType = (inq: any) => {
    if (inq.notes) {
      const match = inq.notes.match(/BILL TYPE:\s*([^\n|]*)/i);
      if (match) return match[1].trim();
    }
    return 'Wholesale Quote';
  };

  const filteredInquiries = initialInquiries.filter((inq) => {
    if (statusFilter !== 'All') {
      const isMatch = inq.status?.toLowerCase() === statusFilter.toLowerCase();
      if (!isMatch) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const invoiceNo = extractInvoiceId(inq).toLowerCase();
      const matchName = inq.customer_name?.toLowerCase().includes(q);
      const matchPhone = inq.customer_phone?.includes(q);
      const matchInvoice = invoiceNo.includes(q);
      if (!matchName && !matchPhone && !matchInvoice) return false;
    }

    return true;
  });

  const formatDate = (isoString: string) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleOpenModal = (inq: any) => {
    setSelectedInquiry(inq);
    setNewStatus(inq.status || 'Pending');
  };

  const handleSaveStatus = async () => {
    if (!selectedInquiry) return;
    setIsUpdating(true);
    try {
      const res = await updateInquiryStatusAction(selectedInquiry.id, newStatus);
      if (res.success) {
        setSelectedInquiry(null);
        router.refresh();
      } else {
        alert(res.error || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-8 -mt-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
            Order Management
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1">
            Review customer orders, invoices, discounts, and delivery statuses.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between gap-4 items-center">
        {/* Status Pills */}
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 scrollbar-hide">
          {['All', 'Pending', 'Quote Sent', 'Closed', 'Paid'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === status
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search by invoice, name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border-0 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-sky-500/20 outline-none"
          />
          <svg
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="border-b border-gray-100 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest bg-gray-50/50">
              <th className="p-4">INVOICE NO</th>
              <th className="p-4">CUSTOMER NAME</th>
              <th className="p-4">PHONE</th>
              <th className="p-4">BILL TYPE</th>
              <th className="p-4">COUPON</th>
              <th className="p-4">DISCOUNT</th>
              <th className="p-4">DELIVERY</th>
              <th className="p-4">TOTAL</th>
              <th className="p-4">DATE</th>
              <th className="p-4 text-center">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-xs font-medium">
            {filteredInquiries.length > 0 ? (
              filteredInquiries.map((inq: any) => {
                const invoiceNo = extractInvoiceId(inq);
                const billType = extractBillType(inq);
                const couponCode = inq.coupon?.code || inq.coupon_id || '—';
                const discountAmt = inq.discount_amount || 0;
                const totalAmt = inq.total_amount || 0;

                return (
                  <tr key={inq.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <Link
                        href={`/invoice/${inq.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1.5 hover:underline"
                        title="View Digital Invoice"
                      >
                        <span>{invoiceNo}</span>
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Link>
                    </td>
                    <td className="p-4 text-gray-900 font-bold">{inq.customer_name}</td>
                    <td className="p-4 text-gray-600 font-semibold">{inq.customer_phone}</td>
                    <td className="p-4 text-gray-600">
                      <span className="px-2 py-0.5 rounded bg-gray-100 font-medium text-[11px]">
                        {billType}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 uppercase font-bold">{couponCode}</td>
                    <td className="p-4 text-emerald-600 font-bold">
                      {discountAmt > 0 ? `-₹${discountAmt.toLocaleString('en-IN')}.00` : '₹0.00'}
                    </td>
                    <td className="p-4 text-gray-500 font-medium">Free</td>
                    <td className="p-4 text-gray-900 font-black">₹{totalAmt.toLocaleString('en-IN')}.00</td>
                    <td className="p-4 text-gray-500 whitespace-nowrap">{formatDate(inq.created_at)}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleOpenModal(inq)}
                        className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase border cursor-pointer ${
                          inq.status === 'Closed' || inq.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : inq.status === 'Quote Sent' 
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {inq.status || 'Pending'}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={10} className="p-12 text-center text-gray-400 font-bold">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order Status Update Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Update Order Status
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Invoice: {extractInvoiceId(selectedInquiry)}
                </p>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-sky-500/20 outline-none"
                >
                  <option value="Pending">Pending</option>
                  <option value="Quote Sent">Quote Sent</option>
                  <option value="Paid">Paid</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleSaveStatus}
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                {isUpdating ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
