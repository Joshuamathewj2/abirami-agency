'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getUserOrdersAction } from '@/app/actions/orderActions';
import { useUserStore } from '@/store/userStore';
import { createClient } from '@/lib/supabase/client';

export default function UserDashboardPage() {
  const { user, profile, clearUser } = useUserStore();
  const [isClient, setIsClient] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    setIsClient(true);
    if (user && user.id) {
      getUserOrdersAction(user.id).then(setOrders);
    }
  }, [user, profile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearUser();
    window.location.href = '/login';
  };

  if (!isClient) return null;
  if (!user) return null;

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Valued Customer';
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

  return (
    <div className="min-h-screen bg-[#fdfaf9] pb-20">
      {/* Premium Header Banner */}
      <div className="relative bg-white pt-8 pb-8 md:pt-10 md:pb-10 border-b border-gray-100 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 opacity-60"></div>
        <div className="container-main relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-gradient-to-br from-sky-100 to-sky-50 border-[3px] border-white shadow-xl shadow-sky-900/5 flex items-center justify-center shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-extrabold text-primary">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-2">
                  My Account
                </h1>
                <p className="text-slate-600 text-base md:text-lg font-medium">Welcome back, {displayName}</p>
                <p className="text-slate-400 mt-1 text-xs font-medium">{user.email}</p>
              </div>
            </div>
            
            <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-slate-600 hover:text-primary hover:border-sky-200 hover:bg-sky-50 rounded-full font-bold transition-all shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container-main py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          {/* Main Content Area */}
          <div className="w-full">
            <section id="orders">
              <div className="flex items-end justify-between mb-8">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Order History
                </h2>
                <span className="text-xs font-bold text-slate-400 tracking-widest uppercase bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                  {orders.length} Order{orders.length !== 1 && 's'}
                </span>
              </div>
              
              {orders.length === 0 ? (
                <div className="relative bg-white rounded-[2rem] p-8 md:p-12 text-center border border-gray-100 shadow-sm overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10 w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner shadow-sky-100 group-hover:scale-110 transition-transform duration-500">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  </div>
                  <h3 className="relative z-10 text-xl md:text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">No orders yet</h3>
                  <p className="relative z-10 text-slate-500 mb-8 max-w-md mx-auto font-medium text-base">
                    When you place an order via WhatsApp or our secure checkout, it will appear here so you can track it.
                  </p>
                  <Link 
                    href="/products" 
                    className="relative z-10 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 active:scale-95 group/btn"
                  >
                    <span>Browse Products</span>
                    <svg className="w-5 h-5 transform group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map(order => (
                    <div key={order.id} className="bg-white border border-gray-100 rounded-[2rem] p-8 md:p-10 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-300">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-8 border-b border-gray-50">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Order #{order.ordId || order.id}</p>
                          <p className="text-slate-600 font-medium">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex flex-col md:items-end gap-3">
                          <div className="text-left md:text-right">
                            <p className="text-2xl font-extrabold text-slate-900">₹{order.totalAmount?.toLocaleString('en-IN')}</p>
                          </div>
                          <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${
                            order.status === 'Pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            order.status === 'Processing' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                            order.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            order.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                            'bg-slate-50 text-slate-600 border border-slate-100'
                          }`}>
                            {order.status}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        {order.items?.map((item: any, i: number) => {
                          const parts = item.dimensions?.split(' x ') || [];
                          const dims = parts[0] || item.dimensions;
                          const height = parts[1] ? ` x ${parts[1]} inch` : '';
                          return (
                            <div key={i} className="flex justify-between items-start text-sm group">
                              <div className="flex gap-4 items-start">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 font-bold text-slate-600 text-xs shrink-0">
                                  {item.quantity}x
                                </span>
                                <div>
                                  <p className="font-bold text-slate-900 text-base">{item.productName}</p>
                                  <p className="text-slate-500 mt-1 font-medium">
                                    {item.sizeLabel} <span className="mx-1.5 text-slate-300">•</span> {dims}{height}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-bold text-slate-900 text-base">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                                {item.quantity > 1 && (
                                  <p className="text-slate-400 text-xs mt-1 font-medium">₹{item.price.toLocaleString('en-IN')} each</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
