'use client';

import React, { useState, useEffect } from 'react';
import { updateInquiryStatusAction, getAllInquiriesAction } from '@/app/actions/orderActions';
import { getColorName, BEDSPREAD_COLORS } from '@/lib/colors';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

type RequestStatus = 'Pending' | 'Contacted' | 'Quote Sent' | 'Paid' | 'Closed' | 'Completed';

interface OrderItem {
  id: string;
  product: string;
  variant: string;
  size: string;
  qty: number;
  unitPrice: number;
  image: string;
}

interface WhatsAppRequest {
  id: string;
  ordId: string;
  customer: string;
  phone: string;
  address: string;
  date: string;
  createdAt: string;
  status: RequestStatus;
  items: OrderItem[];
  discountAmount: number;
  couponId: string | null;
  totalAmount: number;
  invoiceId: string;
}

const calculateTotal = (items: OrderItem[]) => {
  return items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
};

export default function WhatsAppCenterPage() {
  const [requests, setRequests] = useState<WhatsAppRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'All' | 'Today' | 'Week' | 'Month' | 'Custom'>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'status-pending' | 'total-highest' | 'total-lowest'>('newest');

  const fetchInquiries = async () => {
    setLoading(true);
    const res = await getAllInquiriesAction();
    console.log('[CLIENT WhatsAppCenter] getAllInquiriesAction response:', res);
    
    if (!res.success) {
      console.warn('Error fetching inquiries:', res.error);
      setRequests([]);
      setLoading(false);
      return;
    }

    if (res.data) {
      const formattedRequests: WhatsAppRequest[] = res.data.map((inq: any, index: number) => {
        let rawNotes = inq.notes || 'No Address Provided';
        let invoiceId = inq.invoice_id;
        
        if (!invoiceId) {
          const invMatch = rawNotes.match(/INVOICE_ID:\s*(INV-\d{4}-\w{4,8})/i);
          invoiceId = invMatch ? invMatch[1] : `INV-${inq.id.split('-')[0].toUpperCase()}`;
          if (invMatch) {
            rawNotes = rawNotes.replace(invMatch[0], '').trim();
          }
        }

        // Parse items from inquiry_items or fallback notes
        let itemsList: OrderItem[] = [];
        if (inq.inquiry_items && inq.inquiry_items.length > 0) {
          itemsList = inq.inquiry_items.map((item: any) => {
            let image = 'https://placehold.co/400x300?text=Parryware';
            let finalSizeLabel = item.variant?.size_name || 'Standard';
            const dimParts = [];
            if (item.variant?.length && item.variant?.width) dimParts.push(`${item.variant.length}" × ${item.variant.width}"`);
            
            const materialName = item.variant?.mattress?.materials?.name;
            if (materialName) dimParts.push(materialName);
            
            if (dimParts.length > 0) finalSizeLabel += ` (${dimParts.join(', ')})`;
            
            const imagesArr = item.variant?.mattress?.product_images || [];
            const sorted = [...imagesArr].sort((a:any, b:any) => a.sort_order - b.sort_order);
            if (sorted.length > 0) image = sorted[0].image_url;

            return {
              id: item.id,
              product: item.product_name || item.variant?.mattress?.name || 'Sanitaryware Product',
              variant: 'Standard',
              size: finalSizeLabel,
              qty: item.quantity || 1,
              unitPrice: item.unit_price || 0,
              image
            };
          });
        }

        if (itemsList.length === 0) {
          const notesStr = inq.notes || '';
          const itemRegex = /📦\s*\d+\.\s*(.*?)\n(?:.*?\n)*?\s*•\s*Qty:\s*(\d+)\n\s*•\s*(?:Price|💲):\s*₹([\d,]+)/g;
          let match;
          let idx = 1;
          while ((match = itemRegex.exec(notesStr)) !== null) {
            const pName = match[1].trim();
            const qty = parseInt(match[2], 10) || 1;
            const price = parseInt(match[3].replace(/,/g, ''), 10) || 0;
            itemsList.push({
              id: `custom-${idx++}`,
              product: pName,
              variant: 'Standard',
              size: 'Standard',
              qty,
              unitPrice: Math.round(price / qty),
              image: 'https://placehold.co/400x300?text=Sanitaryware'
            });
          }

          if (itemsList.length === 0) {
            itemsList.push({
              id: 'default-item',
              product: inq.notes?.includes('Custom Items:') ? 'Custom Sanitaryware Item' : 'Parryware Product Order',
              variant: 'Standard',
              size: 'Standard',
              qty: 1,
              unitPrice: inq.total_amount || 0,
              image: 'https://placehold.co/400x300?text=Sanitaryware'
            });
          }
        }

        return {
          id: inq.id,
          ordId: `ORD-${new Date(inq.created_at || new Date()).getFullYear()}-${String(res.data.length - index).padStart(4, '0')}`,
          invoiceId: invoiceId || 'N/A',
          customer: inq.customer_name || 'Valued Customer',
          phone: inq.customer_phone || 'N/A',
          address: rawNotes,
          date: inq.created_at ? new Date(inq.created_at).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
          }) : 'Unknown Date',
          createdAt: inq.created_at || new Date().toISOString(),
          status: (inq.status as RequestStatus) || 'Pending',
          discountAmount: inq.discount_amount || 0,
          couponId: inq.coupon?.code || null,
          totalAmount: inq.total_amount || calculateTotal(itemsList),
          items: itemsList,
        };
      });
      setRequests(formattedRequests);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Initial fetch
    fetchInquiries();

    // Supabase Realtime: auto-refresh when inquiries or orders change
    const supabase = createClient();
    const channel = supabase
      .channel('whatsapp-center-sync')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'inquiries' },
        () => fetchInquiries()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'inquiries' },
        () => fetchInquiries()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        () => fetchInquiries()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        () => fetchInquiries()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRequests = requests.filter(req => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      req.customer.toLowerCase().includes(searchLower) ||
      req.phone.includes(searchLower) ||
      req.address.toLowerCase().includes(searchLower) ||
      req.ordId.toLowerCase().includes(searchLower) ||
      req.invoiceId.toLowerCase().includes(searchLower) ||
      req.id.toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    // Time filter
    if (timeFilter === 'All') return true;
    
    const reqDate = new Date(req.createdAt);
    const now = new Date();
    
    if (timeFilter === 'Today') {
      return reqDate.toDateString() === now.toDateString();
    } else if (timeFilter === 'Week') {
      const now = new Date();
      const diffToMonday = now.getDay() === 0 ? 6 : now.getDay() - 1;
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      return reqDate >= startOfWeek && reqDate <= endOfWeek;
    } else if (timeFilter === 'Month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);
      return reqDate >= startOfMonth;
    } else if (timeFilter === 'Custom') {
      if (!startDate && !endDate) return true;
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      return reqDate >= start && reqDate <= end;
    }
    
    return true;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'status-pending') {
      const statusOrder: Record<string, number> = { 'Pending': 0, 'Quote Sent': 1, 'Contacted': 2, 'Paid': 3, 'Completed': 4, 'Closed': 5 };
      return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
    }
    if (sortBy === 'total-highest') {
      return b.totalAmount - a.totalAmount;
    }
    if (sortBy === 'total-lowest') {
      return a.totalAmount - b.totalAmount;
    }
    return 0;
  });

  const stats = {
    total: filteredRequests.length,
    pending: filteredRequests.filter(r => r.status === 'Pending' || r.status === 'Quote Sent').length,
    contacted: filteredRequests.filter(r => r.status === 'Contacted').length,
    completed: filteredRequests.filter(r => r.status === 'Completed' || r.status === 'Paid' || r.status === 'Closed').length,
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'Quote Sent': return 'bg-sky-50 text-sky-600 border-sky-200';
      case 'Contacted': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Paid':
      case 'Completed':
      case 'Closed': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const generateWhatsAppMessage = (req: WhatsAppRequest) => {
    let msg = `*Order Invoice / Request — Abirami Agency*\n`;
    msg += `👤 Customer: ${req.customer}\n`;
    msg += `📞 Phone: ${req.phone}\n`;
    msg += `📄 Invoice ID: ${req.invoiceId}\n`;
    msg += `\n*Items Purchased:*\n`;
    req.items.forEach(item => {
      msg += `• ${item.product} (${item.size}) × ${item.qty} = ₹${(item.qty * item.unitPrice).toLocaleString('en-IN')}\n`;
    });
    
    if (req.discountAmount > 0) {
      msg += `\nDiscount Applied: -₹${req.discountAmount.toLocaleString('en-IN')}`;
    }
    msg += `\n💰 *Total Amount: ₹${req.totalAmount.toLocaleString('en-IN')}*`;
    return msg;
  };

  const handleCopyMessage = (req: WhatsAppRequest) => {
    const msg = generateWhatsAppMessage(req);
    navigator.clipboard.writeText(msg);
    alert('Message copied to clipboard!');
  };

  const updateStatus = async (id: string, newStatus: RequestStatus) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
    const res = await updateInquiryStatusAction(id, newStatus);
    if (!res.success) {
      console.error('Error updating status:', res.error);
      alert('Failed to update status. Reverting.');
      fetchInquiries();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">WhatsApp Center</h2>
          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full shrink-0">
            {stats.pending} pending
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm font-medium w-full lg:w-auto">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button onClick={() => setTimeFilter('All')} className={`px-3 py-1.5 rounded-lg transition-colors ${timeFilter === 'All' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>All</button>
            <button onClick={() => setTimeFilter('Today')} className={`px-3 py-1.5 rounded-lg transition-colors ${timeFilter === 'Today' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Today</button>
            <button onClick={() => setTimeFilter('Week')} className={`px-3 py-1.5 rounded-lg transition-colors ${timeFilter === 'Week' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Week</button>
            <button onClick={() => setTimeFilter('Month')} className={`px-3 py-1.5 rounded-lg transition-colors ${timeFilter === 'Month' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Month</button>
            <button onClick={() => setTimeFilter('Custom')} className={`px-3 py-1.5 rounded-lg transition-colors ${timeFilter === 'Custom' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Custom</button>
            
            {timeFilter === 'Custom' && (
              <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0 sm:ml-2">
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900" 
                />
                <span className="text-gray-500 text-xs">to</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900" 
                />
              </div>
            )}
          </div>
          
          <button onClick={fetchInquiries} className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors ml-auto sm:ml-0">
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Requests</p>
          <p className="text-3xl font-black text-blue-600">{stats.total}</p>
        </div>
        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">Pending / Quote</p>
          <p className="text-3xl font-black text-amber-600">{stats.pending}</p>
        </div>
        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-1">Contacted</p>
          <p className="text-3xl font-black text-blue-600">{stats.contacted}</p>
        </div>
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1">Completed / Paid</p>
          <p className="text-3xl font-black text-emerald-600">{stats.completed}</p>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <h3 className="font-bold text-gray-900">Customer Requests & WhatsApp Log</h3>
            <span className="text-xs font-medium text-gray-400 ml-2">Synced with Supabase Orders</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <input 
                type="text"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 border border-gray-200 bg-white rounded-lg text-sm w-full md:w-48 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-gray-600 outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="status-pending">Pending First</option>
              <option value="total-highest">Total: High to Low</option>
              <option value="total-lowest">Total: Low to High</option>
            </select>

            <span className="text-sm font-medium text-gray-500 hidden sm:inline">{sortedRequests.length} requests</span>
          </div>
        </div>
        
        <div className="overflow-auto max-h-[calc(100vh-250px)]">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[900px]">
            <thead className="bg-white border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4">ORD / INVOICE ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4 text-center">Products</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4 hidden lg:table-cell">Date & Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedRequests.map((req) => {
                const isExpanded = expandedId === req.id;
                
                return (
                  <React.Fragment key={req.id}>
                    {/* Main Row */}
                    <tr 
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${isExpanded ? 'bg-gray-50' : ''}`}
                      onClick={() => setExpandedId(isExpanded ? null : req.id)}
                    >
                      <td className="px-6 py-4 text-xs font-bold text-sky-600">
                        {req.invoiceId !== 'N/A' ? req.invoiceId : req.ordId}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">{req.customer}</td>
                      <td className="px-6 py-4 text-gray-600 font-semibold">{req.phone}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                          {req.items.length} {req.items.length === 1 ? 'item' : 'items'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">₹{req.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs hidden lg:table-cell">
                        {req.date.split(',')[0]}<br/>
                        <span className="text-gray-400">{req.date.split(',')[1]}</span>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={req.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateStatus(req.id, e.target.value as RequestStatus);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border outline-none cursor-pointer appearance-none ${getStatusColor(req.status)}`}
                          style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.25rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em', paddingRight: '2rem' }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Quote Sent">Quote Sent</option>
                          <option value="Paid">Paid</option>
                          <option value="Completed">Completed</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedId(isExpanded ? null : req.id);
                          }}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${isExpanded ? 'bg-gray-900 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                        >
                          {isExpanded ? 'Close' : 'View'}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Content */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="p-0 border-b border-gray-200">
                          <div className="bg-[#fcfdfd] px-6 py-6 border-l-4 border-gray-900 shadow-inner">
                            
                            {/* Customer Quick Info */}
                            <div className="bg-white border border-gray-100 rounded-xl p-4 mb-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                              <div><span className="text-gray-500 font-medium">Customer:</span> <span className="font-bold text-gray-900">{req.customer}</span></div>
                              <div><span className="text-gray-500 font-medium">Phone:</span> <span className="font-bold text-gray-900">{req.phone}</span></div>
                              <div><span className="text-gray-500 font-medium">Invoice ID:</span> <span className="font-bold text-sky-600">{req.invoiceId}</span></div>
                            </div>
                            
                            {/* Products Table */}
                            <div className="bg-white border border-gray-100 rounded-xl overflow-x-auto mb-6">
                              <table className="w-full text-sm min-w-[600px]">
                                <thead className="bg-[#f8f9fa] text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                  <tr>
                                    <th className="px-4 py-3 text-left">Product</th>
                                    <th className="px-4 py-3 text-left">Variant / Size</th>
                                    <th className="px-4 py-3 text-center">Qty</th>
                                    <th className="px-4 py-3 text-right">Unit Price</th>
                                    <th className="px-4 py-3 text-right">Line Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                  {req.items.map((item, idx) => (
                                    <tr key={idx}>
                                      <td className="px-4 py-3 font-bold text-gray-900 flex items-center gap-3">
                                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white shrink-0 border border-gray-100">
                                          <Image src={item.image} alt={item.product} fill sizes="40px" className="object-contain p-0.5" />
                                        </div>
                                        {item.product}
                                      </td>
                                      <td className="px-4 py-3 text-gray-500">{item.size}</td>
                                      <td className="px-4 py-3 text-center font-bold text-gray-900">{item.qty}</td>
                                      <td className="px-4 py-3 text-right text-gray-500">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                                      <td className="px-4 py-3 text-right font-bold text-gray-900">₹{(item.qty * item.unitPrice).toLocaleString('en-IN')}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot className="bg-[#f8f9fa] border-t border-gray-100">
                                  {req.discountAmount > 0 && (
                                    <tr>
                                      <td colSpan={4} className="px-4 py-2 text-right text-xs font-black text-emerald-600 uppercase tracking-widest">
                                        Discount Applied {req.couponId ? `(${req.couponId})` : ''}
                                      </td>
                                      <td className="px-4 py-2 text-right text-sm font-bold text-emerald-600">
                                        -₹{req.discountAmount.toLocaleString('en-IN')}
                                      </td>
                                    </tr>
                                  )}
                                  <tr>
                                    <td colSpan={4} className="px-4 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-widest">
                                      Grand Total
                                    </td>
                                    <td className="px-4 py-4 text-right text-xl font-black text-gray-900">
                                      ₹{req.totalAmount.toLocaleString('en-IN')}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                            
                            {/* WhatsApp Message Generator */}
                            <div className="bg-white border border-gray-100 rounded-xl p-5 relative">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">WhatsApp Message</h4>
                                <button 
                                  onClick={() => handleCopyMessage(req)}
                                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                >
                                  Copy Message
                                </button>
                              </div>
                              <pre className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed border border-gray-100">
                                {generateWhatsAppMessage(req)}
                              </pre>
                            </div>
                            
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              
              {sortedRequests.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No requests found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
