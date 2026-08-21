'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { addCouponAction, toggleCouponStatusAction, deleteCouponAction } from '@/app/actions/couponActions';

export default function CouponsClient({ initialCoupons }: { initialCoupons: any[] }) {
  const router = useRouter();
  const [coupons, setCoupons] = useState(initialCoupons);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  };

  const refreshCoupons = async () => {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (data) setCoupons(data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discount) return alert('Code and Discount are required');

    setIsSubmitting(true);
    
    try {
      await addCouponAction({
        code: code.toUpperCase(),
        percentage: Number(discount),
        min_order_value: minOrder ? Number(minOrder) : null,
        expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
        usage_limit: usageLimit ? Number(usageLimit) : null,
      });
      setCode('');
      setDiscount('');
      setMinOrder('');
      setExpiryDate('');
      setUsageLimit('');
      await refreshCoupons();
    } catch (error: any) {
      alert('Error creating coupon: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleCouponStatusAction(id, !currentStatus);
      await refreshCoupons();
    } catch (err: any) {
      alert('Error updating: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      try {
        await deleteCouponAction(id);
        await refreshCoupons();
      } catch (err: any) {
        alert('Error deleting: ' + err.message);
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    const d = new Date(dateString);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const isExpired = (dateString: string) => {
    if (!dateString) return false;
    const expiry = new Date(dateString);
    expiry.setHours(23, 59, 59, 999);
    return expiry < new Date();
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-8 -mt-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4">
        <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">
          Coupon Management
        </h1>
        <button
          onClick={refreshCoupons}
          className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm font-semibold text-blue-700">
        Coupon discount applies to product subtotal only — not delivery charge.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form (Spans 6 or 7) */}
        <div className="lg:col-span-6 xl:col-span-7 bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            + New Coupon
          </h2>

          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Coupon Code *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3.5 pr-28 text-sm font-bold focus:ring-2 focus:ring-sky-500/20 outline-none uppercase"
                  placeholder="e.g. SUMMER20"
                />
                <button
                  type="button"
                  onClick={generateCode}
                  className="absolute right-2 top-2 bottom-2 px-4 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  Generate
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Discount % *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-sky-500/20 outline-none"
                  placeholder="e.g. 15"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Min Order (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={minOrder}
                  onChange={e => setMinOrder(e.target.value)}
                  className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-sky-500/20 outline-none"
                  placeholder="e.g. 1000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Expiry Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setExpiryDate(e.target.value)}
                  className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-sky-500/20 outline-none text-gray-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Usage Limit</label>
                <input
                  type="number"
                  min="1"
                  value={usageLimit}
                  onChange={e => setUsageLimit(e.target.value)}
                  className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-sky-500/20 outline-none"
                  placeholder="e.g. 50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white py-4 rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Creating Coupon...' : '+ Save & Create Coupon'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-6 xl:col-span-5 bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm flex flex-col max-h-[800px]">
          <div className="flex flex-col gap-4 mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center justify-between">
              All Coupons ({filteredCoupons.length})
            </h2>
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search coupons by code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-red-500/20 outline-none transition"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {filteredCoupons.length > 0 ? filteredCoupons.map(coupon => {
              const expired = isExpired(coupon.expiry_date);
              
              return (
                <div key={coupon.id} className="bg-[#FAF9F6] border border-[#F2EFE9] rounded-2xl p-4 flex justify-between items-start hover:border-red-100 transition-colors">
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-sm">{coupon.code}</h3>
                    <p className="text-xs font-bold text-green-700 mt-1">
                      {coupon.percentage}% off {coupon.min_order_value ? `· min ₹${coupon.min_order_value}` : ''}
                    </p>
                    <p className="text-[10px] font-semibold text-gray-400 mt-1">
                      {coupon.usage_limit 
                        ? `${Math.max(0, coupon.usage_limit - (coupon.usage_count || 0))} remaining` 
                        : `Used ${coupon.usage_count || 0} times`} · {coupon.expiry_date ? `expires ${formatDate(coupon.expiry_date)}` : 'No expiry'}
                    </p>
                    {expired && (
                      <p className="text-[10px] font-extrabold text-red-500 mt-0.5">Expired</p>
                    )}
                  </div>
                  <div className="flex gap-3 items-center">
                    {!expired && (
                      <button 
                        onClick={() => toggleStatus(coupon.id, coupon.is_active)}
                        className={`text-[10px] font-extrabold uppercase ${coupon.is_active ? 'text-green-600 hover:text-gray-500' : 'text-gray-400 hover:text-green-600'}`}
                      >
                        {coupon.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    )}
                    <button className="text-[10px] font-extrabold text-blue-500 hover:text-blue-700 uppercase">
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(coupon.id)}
                      className="text-[10px] font-extrabold text-red-500 hover:text-red-700 uppercase"
                    >
                      Del
                    </button>
                  </div>
                </div>
              );
            }) : (
              <p className="text-center text-gray-400 text-sm font-bold py-10">No coupons found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
