'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';

export default function AnalyticsClient({ initialInquiries = [] }: { initialInquiries: any[] }) {
  const router = useRouter();
  const [period, setPeriod] = useState('All Time');
  const [activeTab, setActiveTab] = useState('REVENUE');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [isTopProductModalOpen, setIsTopProductModalOpen] = useState(false);
  const [todaySearch, setTodaySearch] = useState('');
  const [couponSearch, setCouponSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedMetric, setSelectedMetric] = useState<{
    title: string;
    value: string;
    description: string;
    icon: string;
  } | null>(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const getWeekNumber = (d: Date) => {
    const dObj = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = dObj.getUTCDay() || 7;
    dObj.setUTCDate(dObj.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(dObj.getUTCFullYear(),0,1));
    return Math.ceil((((dObj.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
  };
  const currentWeek = getWeekNumber(now);

  // Only include completed/paid orders in revenue analytics.
  // Pending and Contacted WhatsApp inquiries are tracked in WhatsApp Center
  // but must NOT inflate revenue figures until the sale is confirmed.
  const COMPLETED_STATUSES = ['Completed', 'Paid', 'Closed', 'completed', 'paid', 'closed'];

  const validInitialInquiries = useMemo(() => {
    return (initialInquiries || []).filter(order =>
      order &&
      (order.total_amount > 0 || order.created_at) &&
      COMPLETED_STATUSES.includes(order.status || '')
    );
  }, [initialInquiries]);

  const isToday = useCallback((d: Date) => !isNaN(d.getTime()) && d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(), [now.getDate(), now.getMonth(), now.getFullYear()]);
  const isThisMonth = useCallback((d: Date) => !isNaN(d.getTime()) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(), [now.getMonth(), now.getFullYear()]);

  const filteredInquiries = useMemo(() => {
    return validInitialInquiries.filter(order => {
      if (!order.created_at) return false;
      const d = new Date(order.created_at);
      if (period === 'All Time') return true;
      if (period === 'Today') return isToday(d);
      if (period === 'This Week') {
        const now = new Date();
        const diffToMonday = now.getDay() === 0 ? 6 : now.getDay() - 1;
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        return d >= startOfWeek && d <= endOfWeek;
      }
      if (period === 'This Month') return isThisMonth(d);
      if (period === 'This Year') return d.getFullYear() === now.getFullYear();
      if (period === 'Custom' && customFrom && customTo) {
        const from = new Date(customFrom);
        const to = new Date(customTo);
        to.setHours(23, 59, 59, 999);
        return d >= from && d <= to;
      }
      return true;
    });
  }, [initialInquiries, period, customFrom, customTo]);

  // Aggregate Stats
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let completedBills = 0;
    let offlineBills = 0;
    let onlineBills = 0;
    let offlineBillsCount = 0;
    let onlineBillsCount = 0;
    let totalItemsSold = 0;
    const productRevenue: Record<string, { revenue: number, qty: number, isCustom?: boolean }> = {};

    filteredInquiries.forEach(order => {
      const amt = order.total_amount || 0;
      totalRevenue += amt;
      completedBills++;
      
      const notes = order.notes || '';
      const isOffline = notes.includes('CHANNEL: pos') || notes.includes('OFFLINE') || notes.includes('MANUAL') || order.bill_type === 'retail' || order.bill_type === 'wholesale';
      if (isOffline) {
        offlineBills += amt;
        offlineBillsCount++;
      } else {
        onlineBills += amt;
        onlineBillsCount++;
      }

      // Try structured items first (order_items or inquiry_items), then fall back to notes parsing
      const items = order.inquiry_items || order.order_items || [];
      if (items && Array.isArray(items) && items.length > 0) {
         items.forEach((item: any) => {
           const qty = item.quantity || 1;
           const price = item.unit_price || item.price || 0;
           const itemRev = qty * price;
           totalItemsSold += qty;
           
           let productName = 'Unknown Product';
           if (item.variant?.mattress?.name) productName = item.variant.mattress.name;
           else if (item.product_name) productName = item.product_name;
           
           if (!productRevenue[productName]) productRevenue[productName] = { revenue: 0, qty: 0, isCustom: false };
           productRevenue[productName].revenue += itemRev;
           productRevenue[productName].qty += qty;
         });
      } else {
        // Parse line items from WhatsApp invoice notes as fallback
        const customMatch = notes.match(/Custom Items:\s*(.*?)(?:\n|\||$)/i);
        if (customMatch && customMatch[1]) {
          const parts = customMatch[1].split(', ');
          parts.forEach((part: string) => {
             const nameMatch = part.match(/^(.*?)\s*\(Qty:/);
             const qtyMatch = part.match(/\(Qty:\s*(\d+)\)/);
             const priceMatch = part.match(/@\s*₹([\d,]+)/);
             if (nameMatch) {
               const cName = nameMatch[1].trim();
               const cQty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
               const itemRev = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) * cQty : (amt || 0);
               totalItemsSold += cQty;
               if (!productRevenue[cName]) productRevenue[cName] = { revenue: 0, qty: 0, isCustom: true };
               productRevenue[cName].revenue += itemRev;
               productRevenue[cName].qty += cQty;
               productRevenue[cName].isCustom = true;
             }
          });
        } else {
          // WhatsApp receipt format: "📦 1. Product Name\n   • Qty: N\n   • Price: ₹X"
          const itemRegex = /📦\s*\d+\.\s*(.*?)\n\s*•\s*Qty:\s*(\d+)\n\s*•\s*(?:Price|💲):\s*₹([\d,]+)/g;
          let match;
          while ((match = itemRegex.exec(notes)) !== null) {
            const cName = match[1].trim();
            const cQty = parseInt(match[2], 10) || 1;
            const lineTotal = parseInt(match[3].replace(/,/g, ''), 10);
            const unitPrice = cQty > 0 ? Math.round(lineTotal / cQty) : lineTotal;
            totalItemsSold += cQty;
            if (!productRevenue[cName]) productRevenue[cName] = { revenue: 0, qty: 0, isCustom: true };
            productRevenue[cName].revenue += lineTotal;
            productRevenue[cName].qty += cQty;
            productRevenue[cName].isCustom = true;
          }
          // If still nothing parsed, attribute whole order amount to an aggregated product name
          if (Object.keys(productRevenue).length === 0 && amt > 0) {
            const fallbackName = 'Sanitaryware Order';
            if (!productRevenue[fallbackName]) productRevenue[fallbackName] = { revenue: 0, qty: 0, isCustom: true };
            productRevenue[fallbackName].revenue += amt;
            productRevenue[fallbackName].qty += 1;
            productRevenue[fallbackName].isCustom = true;
          }
        }
      }
    });

    const avgOrderValue = completedBills > 0 ? Math.round(totalRevenue / completedBills) : 0;

    const topItems = Object.keys(productRevenue)
      .map(k => ({ name: k, ...productRevenue[k] }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const topProduct = topItems.length > 0 ? topItems[0].name : 'None';
    const maxItemRev = topItems.length > 0 ? topItems[0].revenue : 1;
    
    const allProductsList = Object.keys(productRevenue)
      .map(k => ({ name: k, ...productRevenue[k] }))
      .sort((a, b) => b.revenue - a.revenue);

    return { totalRevenue, completedBills, offlineBills, onlineBills, offlineBillsCount, onlineBillsCount, totalItemsSold, avgOrderValue, topProduct, topItems, maxItemRev, allProductsList };
  }, [filteredInquiries]);

  const { totalRevenue, completedBills, offlineBills, onlineBills, offlineBillsCount, onlineBillsCount, totalItemsSold, avgOrderValue, topProduct, topItems, maxItemRev, allProductsList } = stats;


  const todayStats = useMemo(() => {
    let todayRevenue = 0;
    let todayBills = 0;
    let todayItemsSold = 0;
    let todayOfflineBillsCount = 0;
    let todayOnlineBillsCount = 0;
    let todayOfflineRevenue = 0;
    let todayOnlineRevenue = 0;
    const todayTransactions: any[] = [];
    const todayProductRevenue: Record<string, { revenue: number, qty: number, isCustom?: boolean }> = {};

    validInitialInquiries.forEach(order => {
      const d = new Date(order.created_at);
      if (isToday(d)) {
        todayTransactions.push(order);
        const amt = order.total_amount || 0;
        todayRevenue += amt;
        todayBills++;
        
        const notes = order.notes || '';
        if (notes.includes('OFFLINE') || notes.includes('MANUAL')) {
          todayOfflineBillsCount++;
          todayOfflineRevenue += amt;
        } else {
          todayOnlineBillsCount++;
          todayOnlineRevenue += amt;
        }

        const items = order.order_items || order.inquiry_items || [];
        items.forEach((item: any) => { 
          const qty = item.quantity || 1;
          const price = item.unit_price || item.price || 0;
          const itemRev = qty * price;
          todayItemsSold += qty;
          
          let productName = 'Unknown Product';
          if (item.variant?.mattress?.name) productName = item.variant.mattress.name;
          else if (item.product_name) productName = item.product_name;

          if (!todayProductRevenue[productName]) todayProductRevenue[productName] = { revenue: 0, qty: 0, isCustom: false };
          todayProductRevenue[productName].revenue += itemRev;
          todayProductRevenue[productName].qty += qty;
        });

        const customMatch = notes.match(/Custom Items:\s*(.*?)(?:\n|\||$)/i);
        if (customMatch && customMatch[1]) {
          const parts = customMatch[1].split(', ');
          parts.forEach((part: string) => {
             const nameMatch = part.match(/^(.*?)\s*\(Qty:/);
             const qtyMatch = part.match(/\(Qty:\s*(\d+)\)/);
             const priceMatch = part.match(/@\s*₹([\d,]+)/);
             if (nameMatch) {
               const cName = nameMatch[1].trim();
               const cQty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
               const itemRev = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) * cQty : (amt || 0);
               todayItemsSold += cQty;
               if (!todayProductRevenue[cName]) todayProductRevenue[cName] = { revenue: 0, qty: 0, isCustom: true };
               todayProductRevenue[cName].revenue += itemRev;
               todayProductRevenue[cName].qty += cQty;
               todayProductRevenue[cName].isCustom = true;
             }
          });
        } else {
          const itemRegex = /📦\s*\d+\.\s*(.*?)\n\s*•\s*Qty:\s*(\d+)\n\s*•\s*💲\s*₹([\d,]+)/g;
          let match;
          while ((match = itemRegex.exec(notes)) !== null) {
            const cName = match[1].trim();
            const cQty = parseInt(match[2], 10) || 1;
            const itemRev = parseInt(match[3].replace(/,/g, ''), 10);
            todayItemsSold += cQty;
            if (!todayProductRevenue[cName]) todayProductRevenue[cName] = { revenue: 0, qty: 0, isCustom: true };
            todayProductRevenue[cName].revenue += itemRev;
            todayProductRevenue[cName].qty += cQty;
            todayProductRevenue[cName].isCustom = true;
          }
        }
      }
    });

    const todayAvgOrder = todayBills > 0 ? Math.round(todayRevenue / todayBills) : 0;

    const todayTopItems = Object.keys(todayProductRevenue)
      .map(k => ({ name: k, ...todayProductRevenue[k] }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);
    const maxTodayItemRev = todayTopItems.length > 0 ? todayTopItems[0].revenue : 1;

    const todayTopProduct = todayTopItems.length > 0 ? todayTopItems[0].name : 'N/A';

    return { todayRevenue, todayBills, todayItemsSold, todayOfflineBillsCount, todayOnlineBillsCount, todayOfflineRevenue, todayOnlineRevenue, todayTransactions, todayAvgOrder, todayTopItems, maxTodayItemRev, todayTopProduct };
  }, [validInitialInquiries, isToday]);

  const { todayRevenue, todayBills, todayItemsSold, todayOfflineBillsCount, todayOnlineBillsCount, todayOfflineRevenue, todayOnlineRevenue, todayTransactions, todayAvgOrder, todayTopItems, maxTodayItemRev, todayTopProduct } = todayStats;

  const trendStats = useMemo(() => {
    const yearData = [
      { name: 'JAN', value: 0 }, { name: 'FEB', value: 0 }, { name: 'MAR', value: 0 },
      { name: 'APR', value: 0 }, { name: 'MAY', value: 0 }, { name: 'JUN', value: 0 },
      { name: 'JUL', value: 0 }, { name: 'AUG', value: 0 }, { name: 'SEP', value: 0 },
      { name: 'OCT', value: 0 }, { name: 'NOV', value: 0 }, { name: 'DEC', value: 0 }
    ];
    
    const weekData = [
      { name: 'MON', value: 0, fill: '#e5e5e5' }, { name: 'TUE', value: 0, fill: '#e5e5e5' }, { name: 'WED', value: 0, fill: '#0070ba' },
      { name: 'THU', value: 0, fill: '#e5e5e5' }, { name: 'FRI', value: 0, fill: '#e5e5e5' }, { name: 'SAT', value: 0, fill: '#e5e5e5' },
      { name: 'SUN', value: 0, fill: '#e5e5e5' }
    ];

    validInitialInquiries.forEach(order => {
      const d = new Date(order.created_at);
      if (d.getFullYear() === now.getFullYear()) {
        const m = d.getMonth();
        if (!isNaN(m) && yearData[m]) {
          yearData[m].value += order.total_amount || 0;
        }

        if (getWeekNumber(d) === currentWeek) {
          const dayIndex = d.getDay();
          const map = [6, 0, 1, 2, 3, 4, 5]; // 0=SUN->6, 1=MON->0
          const targetIdx = map[dayIndex];
          if (weekData[targetIdx]) {
            weekData[targetIdx].value += order.total_amount || 0;
            weekData[targetIdx].fill = '#0070ba'; // active color
          }
        }
      }
    });

    const yearlyTotalRevenue = yearData.reduce((acc, curr) => acc + curr.value, 0);
    const weeklyTotalRevenue = weekData.reduce((acc, curr) => acc + curr.value, 0);

    return { yearData, weekData, yearlyTotalRevenue, weeklyTotalRevenue };
  }, [validInitialInquiries, now, currentWeek]);

  const { yearData, weekData, yearlyTotalRevenue, weeklyTotalRevenue } = trendStats;

  const couponData = useMemo(() => {
    const coupons: any[] = [];
    let totalDiscountGiven = 0;
    
    filteredInquiries.forEach(order => {
      const discount = Number(order.discount_amount || 0);
      if (discount > 0) {
        let invId = order.invoice_id;
        if (!invId && order.notes) {
          const match = order.notes.match(/INVOICE_ID:\s*(INV-\d{4}-\w{4,8})/i);
          if (match) invId = match[1];
        }
        if (!invId) invId = `INV-????-${order.id.split('-')[0].toUpperCase()}`;

        coupons.push({
          id: invId,
          mobile: order.customer_phone || 'N/A',
          total: order.total_amount || 0,
          discount: discount
        });
        totalDiscountGiven += discount;
      }
    });

    const discountedOrders = coupons.length;
    const avgDiscountPerOrder = discountedOrders > 0 ? Math.round(totalDiscountGiven / discountedOrders) : 0;

    return { coupons, totalDiscountGiven, discountedOrders, avgDiscountPerOrder };
  }, [filteredInquiries]);

  const filteredTodayTransactions = useMemo(() => {
    return todayTransactions.filter(tx => {
      let invId = tx.invoice_id;
      if (!invId && tx.notes) {
        const match = tx.notes.match(/INVOICE_ID:\s*(INV-\d{4}-\w{4,8})/i);
        if (match) invId = match[1];
      }
      if (!invId) invId = `INV-????-${tx.id.split('-')[0].toUpperCase()}`;

      const name = (tx.customer_name || '').toLowerCase();
      const phone = (tx.customer_phone || '').toLowerCase();
      const searchId = invId.toLowerCase();
      const query = todaySearch.toLowerCase();
      return name.includes(query) || phone.includes(query) || searchId.includes(query);
    });
  }, [todayTransactions, todaySearch]);

  const filteredCoupons = useMemo(() => {
    return couponData.coupons.filter(c => {
      const id = (c.id || '').toLowerCase();
      const mobile = (c.mobile || '').toLowerCase();
      const query = couponSearch.toLowerCase();
      return id.includes(query) || mobile.includes(query) || String(c.total).includes(query) || String(c.discount).includes(query);
    });
  }, [couponData.coupons, couponSearch]);

  return (
    <div className="font-sans flex flex-col h-full w-full">
      <div className="w-full flex-1">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">POS Analytics</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Real-time store & channel insights</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <>
              <div className="flex flex-wrap items-center bg-white rounded-2xl md:rounded-full border border-slate-200 p-1 shadow-sm text-xs font-bold text-slate-600 gap-1 w-full md:w-auto">
                <span className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-400">Period:</span>
                {['ALL TIME', 'TODAY', 'THIS WEEK', 'THIS MONTH', 'THIS YEAR', 'CUSTOM'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p === 'ALL TIME' ? 'All Time' : p === 'TODAY' ? 'Today' : p === 'THIS WEEK' ? 'This Week' : p === 'THIS MONTH' ? 'This Month' : p === 'THIS YEAR' ? 'This Year' : 'Custom')}
                    className={`px-4 py-1.5 rounded-full transition-colors ${
                      period.toUpperCase() === p 
                        ? 'bg-[#0070ba] text-white' 
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {period === 'Custom' && (
                <div className="flex flex-wrap items-center bg-white rounded-2xl md:rounded-full border border-slate-200 px-4 py-2 shadow-sm text-xs font-bold text-slate-700 gap-2 w-full md:w-auto">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 mr-2">FROM:</span>
                  <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="outline-none bg-transparent" />
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 mx-3">TO:</span>
                  <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="outline-none bg-transparent" />
                </div>
              )}
            </>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 md:gap-8 border-b border-slate-200 mb-8 px-1 overflow-x-auto whitespace-nowrap scrollbar-none">
          {['REVENUE', "TODAY'S SALES", 'PRODUCTS', 'COUPONS'].map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors relative ${
                activeTab === t ? 'text-[#0070ba]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t}
              {activeTab === t && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0070ba]"></span>
              )}
            </button>
          ))}
        </div>

        {/* REVENUE TAB */}
        {activeTab === 'REVENUE' && (
          <>
            {/* Stat Cards - Row 1 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div 
                onClick={() => setSelectedMetric({
                  title: 'Total Revenue',
                  value: `₹${totalRevenue.toLocaleString('en-IN')}`,
                  description: 'POS + manual combined',
                  icon: '₹'
                })}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between h-[120px] cursor-pointer hover:border-slate-350 hover:shadow transition-all"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Revenue</span>
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs shrink-0">₹</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-black text-slate-900 truncate" title={`₹${totalRevenue.toLocaleString('en-IN')}`}>
                    ₹{totalRevenue.toLocaleString('en-IN')}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">POS + manual combined</p>
                </div>
              </div>
              
              <div 
                onClick={() => setSelectedMetric({
                  title: 'Completed Bills',
                  value: String(completedBills),
                  description: 'POS + manual bills',
                  icon: '🏆'
                })}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between h-[120px] cursor-pointer hover:border-slate-350 hover:shadow transition-all"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Completed Bills</span>
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs shrink-0">🏆</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-black text-slate-900 truncate" title={String(completedBills)}>
                    {completedBills}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">POS + manual bills</p>
                </div>
              </div>

              <div 
                onClick={() => setSelectedMetric({
                  title: 'Offline Bills',
                  value: `₹${offlineBills.toLocaleString('en-IN')}`,
                  description: 'Walk-in POS sales',
                  icon: '₹'
                })}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between h-[120px] cursor-pointer hover:border-slate-350 hover:shadow transition-all"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Offline Bills</span>
                  <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center text-xs shrink-0">₹</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-black text-slate-900 truncate" title={`₹${offlineBills.toLocaleString('en-IN')}`}>
                    ₹{offlineBills.toLocaleString('en-IN')}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">Walk-in POS sales</p>
                </div>
              </div>

              <div 
                onClick={() => setSelectedMetric({
                  title: 'Online Bills',
                  value: `₹${onlineBills.toLocaleString('en-IN')}`,
                  description: 'Online POS sales',
                  icon: '₹'
                })}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between h-[120px] cursor-pointer hover:border-slate-355 hover:shadow transition-all"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Online Bills</span>
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs shrink-0">₹</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-black text-slate-900 truncate" title={`₹${onlineBills.toLocaleString('en-IN')}`}>
                    ₹{onlineBills.toLocaleString('en-IN')}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">Online POS sales</p>
                </div>
              </div>
            </div>

            {/* Stat Cards - Row 2 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              <div 
                onClick={() => setSelectedMetric({
                  title: 'Total Offline Bills',
                  value: String(offlineBillsCount),
                  description: 'Walk-in POS orders',
                  icon: '🛍️'
                })}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between h-[120px] cursor-pointer hover:border-slate-350 hover:shadow transition-all"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Offline Bills</span>
                  <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs shrink-0">🛍️</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-black text-slate-900 truncate" title={String(offlineBillsCount)}>
                    {offlineBillsCount}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">Walk-in POS orders</p>
                </div>
              </div>

              <div 
                onClick={() => setSelectedMetric({
                  title: 'Total Online Bills',
                  value: String(onlineBillsCount),
                  description: 'Online channel orders',
                  icon: '🌐'
                })}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between h-[120px] cursor-pointer hover:border-slate-350 hover:shadow transition-all"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Online Bills</span>
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs shrink-0">🌐</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-black text-slate-900 truncate" title={String(onlineBillsCount)}>
                    {onlineBillsCount}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">Online channel orders</p>
                </div>
              </div>

              <div 
                onClick={() => setSelectedMetric({
                  title: 'Total Items Sold',
                  value: String(totalItemsSold),
                  description: 'From completed bills',
                  icon: '📦'
                })}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between h-[120px] cursor-pointer hover:border-slate-350 hover:shadow transition-all"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Items Sold</span>
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs shrink-0">📦</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-black text-slate-900 truncate" title={String(totalItemsSold)}>
                    {totalItemsSold}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">From completed bills</p>
                </div>
              </div>

              <div 
                onClick={() => setSelectedMetric({
                  title: 'Avg Order Value',
                  value: `₹${avgOrderValue.toLocaleString('en-IN')}`,
                  description: 'Per completed order',
                  icon: '⚡'
                })}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between h-[120px] cursor-pointer hover:border-slate-350 hover:shadow transition-all"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg Order Value</span>
                  <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs shrink-0">⚡</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-black text-slate-900 truncate" title={`₹${avgOrderValue.toLocaleString('en-IN')}`}>
                    ₹{avgOrderValue.toLocaleString('en-IN')}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">Per completed order</p>
                </div>
              </div>

              <div 
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between h-[120px] cursor-pointer hover:border-blue-200 hover:shadow transition-all"
                onClick={() => setIsTopProductModalOpen(true)}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Top Product</span>
                  <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs shrink-0">⭐</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-black text-slate-900 truncate" title={topProduct}>{topProduct}</h3>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">Most sold item</p>
                </div>
              </div>
            </div>

            {/* Charts & Lists Area */}
            <style>{`
              .recharts-wrapper, .recharts-wrapper *, .recharts-surface, .recharts-surface:focus {
                outline: none !important;
              }
            `}</style>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column (Charts) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Year Trend */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h2 className="text-sm font-bold text-slate-700">Revenue Trend This Year <span className="text-[#0070ba]">{currentYear}</span></h2>
                  <div className="flex items-center gap-3 mt-2 mb-6">
                    <span className="text-2xl font-black text-slate-900">₹{yearlyTotalRevenue.toLocaleString('en-IN')}</span>
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded">Avg ₹{Math.round(yearlyTotalRevenue/12).toLocaleString('en-IN')}/mo</span>
                  </div>
                  
                  <div className="h-[220px] w-full overflow-x-auto overflow-y-hidden no-scrollbar [&_.recharts-wrapper]:outline-none [&_svg]:outline-none [&_.recharts-rectangle]:outline-none">
                    <div className="min-w-[450px] h-full">
                      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} className="focus:outline-none">
                        <BarChart data={yearData} margin={{ top: 20, right: 10, bottom: 0, left: 10 }} style={{ outline: 'none' }}>
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
                          dy={10}
                        />
                        <RechartsTooltip 
                          cursor={false}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '8px 12px' }}
                          itemStyle={{ fontWeight: 800, color: '#0070ba', fontSize: '14px' }}
                          labelStyle={{ display: 'none' }}
                          formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                        />
                        <Bar 
                          dataKey="value" 
                          fill="#0070ba" 
                          radius={[4, 4, 0, 0]} 
                          barSize={16}
                          activeBar={false}
                          style={{ outline: 'none' }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

                {/* Week Trend */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h2 className="text-sm font-bold text-slate-700">Revenue This Week <span className="text-[#0070ba]">(Week {currentWeek} of {currentYear})</span></h2>
                  <p className="text-[10px] text-slate-500 mt-1 mb-6">₹{weeklyTotalRevenue.toLocaleString('en-IN')} total</p>
                  
                  <div className="h-[220px] w-full overflow-x-auto overflow-y-hidden no-scrollbar [&_.recharts-wrapper]:outline-none [&_svg]:outline-none [&_.recharts-rectangle]:outline-none">
                    <div className="min-w-[350px] h-full">
                      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} className="focus:outline-none">
                        <BarChart data={weekData} margin={{ top: 20, right: 10, bottom: 0, left: 10 }} style={{ outline: 'none' }}>
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
                          dy={10}
                        />
                        <RechartsTooltip 
                          cursor={false}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '8px 12px' }}
                          itemStyle={{ fontWeight: 800, color: '#0070ba', fontSize: '14px' }}
                          labelStyle={{ display: 'none' }}
                          formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                        />
                        <Bar 
                          dataKey="value" 
                          radius={[4, 4, 0, 0]} 
                          barSize={20}
                          activeBar={false}
                          style={{ outline: 'none' }}
                        >
                          {weekData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} style={{ outline: 'none' }} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              </div>

              {/* Right Column (Lists) */}
              <div className="space-y-6">
                
                {/* Order Source */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h2 className="text-sm font-bold text-slate-700 mb-6">Order Source</h2>
                  
                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-[#0070ba] uppercase tracking-widest">OFFLINE</span>
                        <span className="text-sm font-black text-slate-900">{offlineBillsCount}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-[#0070ba] h-2.5 rounded-full transition-all duration-500" 
                          style={{ width: `${offlineBillsCount + onlineBillsCount > 0 ? (offlineBillsCount / (offlineBillsCount + onlineBillsCount)) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">ONLINE</span>
                        <span className="text-sm font-black text-slate-900">{onlineBillsCount}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500" 
                          style={{ width: `${offlineBillsCount + onlineBillsCount > 0 ? (onlineBillsCount / (offlineBillsCount + onlineBillsCount)) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Items by Revenue */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h2 className="text-sm font-bold text-slate-700 mb-6">Top Items by Revenue</h2>
                  
                  <div className="space-y-5">
                    {topItems.length > 0 ? topItems.map((item, idx) => (
                      <div key={idx} className="relative">
                        <div className="flex items-center gap-3 mb-1.5">
                          <span className="text-xs font-bold text-slate-400 w-3">{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            {item.isCustom && <div className="text-[9px] font-black text-[#0070ba] uppercase tracking-widest leading-none mb-0.5">CUSTOM</div>}
                            <span className="text-xs font-bold text-slate-700 block truncate">{item.name}</span>
                          </div>
                          <div className="flex flex-col items-end justify-center">
                            <span className="text-xs font-black text-[#0070ba]">₹{item.revenue.toLocaleString('en-IN')}</span>
                            <span className="text-[9px] text-slate-400">{item.qty} pcs</span>
                          </div>
                        </div>
                        <div className="w-full bg-transparent h-1.5 pl-6 pr-8">
                          <div className="bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#0070ba] h-1.5 rounded-full" style={{ width: `${(item.revenue / maxItemRev) * 100}%` }}></div>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <p className="text-xs text-slate-500 text-center py-4">No items sold in this period.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* TODAY'S SALES TAB */}
        {activeTab === "TODAY'S SALES" && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div 
                onClick={() => setSelectedMetric({
                  title: "Today's Revenue",
                  value: `₹${todayRevenue.toLocaleString('en-IN')}`,
                  description: 'Completed today',
                  icon: '₹'
                })}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between h-[120px] cursor-pointer hover:border-slate-350 hover:shadow transition-all"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Today's Revenue</span>
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs shrink-0">₹</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-black text-slate-900 truncate" title={`₹${todayRevenue.toLocaleString('en-IN')}`}>
                    ₹{todayRevenue.toLocaleString('en-IN')}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">Completed today</p>
                </div>
              </div>

              <div 
                onClick={() => setSelectedMetric({
                  title: "Today's Bills",
                  value: String(todayBills),
                  description: 'Completed today',
                  icon: '🏆'
                })}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between h-[120px] cursor-pointer hover:border-slate-350 hover:shadow transition-all"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Today's Bills</span>
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs shrink-0">🏆</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-black text-slate-900 truncate" title={String(todayBills)}>
                    {todayBills}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">Completed today</p>
                </div>
              </div>

              <div 
                onClick={() => setSelectedMetric({
                  title: "Today's Items Sold",
                  value: `${todayItemsSold} pcs`,
                  description: 'Quantity sold today',
                  icon: '📦'
                })}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between h-[120px] cursor-pointer hover:border-slate-350 hover:shadow transition-all"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Today's Items Sold</span>
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs shrink-0">📦</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-black text-slate-900 truncate" title={`${todayItemsSold} pcs`}>
                    {todayItemsSold} <span className="text-xs sm:text-sm">pcs</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">Quantity sold today</p>
                </div>
              </div>

              <div 
                onClick={() => setSelectedMetric({
                  title: "Today's Avg Order Value",
                  value: `₹${todayAvgOrder.toLocaleString('en-IN')}`,
                  description: 'Per invoice today',
                  icon: '⚡'
                })}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between h-[120px] cursor-pointer hover:border-slate-350 hover:shadow transition-all"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Today's Avg Order Value</span>
                  <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs shrink-0">⚡</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-black text-slate-900 truncate" title={`₹${todayAvgOrder.toLocaleString('en-IN')}`}>
                    ₹{todayAvgOrder.toLocaleString('en-IN')}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">Per invoice today</p>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column (Table) */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm h-full flex flex-col">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">TODAY'S TRANSACTIONS</h2>
                <div className="relative w-full sm:w-64">
                  <input 
                    type="text" 
                    placeholder="Search contact no..." 
                    value={todaySearch}
                    onChange={e => setTodaySearch(e.target.value)}
                    className="pl-8 pr-4 py-2 border border-slate-200 rounded-full text-xs w-full outline-none focus:border-slate-400 bg-slate-50" 
                  />
                  <svg className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-100">
                      <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Invoice ID</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Customer No</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Source</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Items</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Grand Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTodayTransactions.length > 0 ? (
                      filteredTodayTransactions.map((tx, idx) => {
                        const source = (tx.notes || '').toUpperCase().includes('OFFLINE') || (tx.notes || '').toUpperCase().includes('MANUAL') ? 'OFFLINE' : 'ONLINE';
                        const items = tx.order_items || tx.inquiry_items || [];
                        let totalItems = items.reduce((acc: number, curr: any) => acc + (curr.quantity || 1), 0);
                        
                        const customMatch = (tx.notes || '').match(/Custom Items:\s*(.*?)(?:\n|\||$)/i);
                        if (customMatch && customMatch[1]) {
                          const parts = customMatch[1].split(', ');
                          parts.forEach((part: string) => {
                             const qtyMatch = part.match(/\(Qty:\s*(\d+)\)/);
                             if (qtyMatch) {
                               totalItems += parseInt(qtyMatch[1], 10);
                             }
                          });
                        } else {
                          const itemRegex = /📦\s*\d+\.\s*(.*?)\n\s*•\s*Qty:\s*(\d+)/g;
                          let match;
                          while ((match = itemRegex.exec(tx.notes || '')) !== null) {
                            totalItems += parseInt(match[2], 10) || 1;
                          }
                        }
                        
                        let invId = tx.invoice_id;
                        if (!invId && tx.notes) {
                          const match = tx.notes.match(/INVOICE_ID:\s*(INV-\d{4}-\w{4,8})/i);
                          if (match) invId = match[1];
                        }
                        if (!invId) invId = `INV-????-${tx.id.split('-')[0].toUpperCase()}`;


                        return (
                          <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-4 text-xs font-bold text-slate-700">{invId}</td>
                            <td className="py-4 px-4 text-xs text-slate-600 font-medium">{tx.customer_phone || 'N/A'}</td>
                            <td className="py-4 px-4 text-xs font-bold text-center">
                              <span className={`px-2 py-1 rounded text-[9px] uppercase tracking-wider ${source === 'ONLINE' ? 'bg-emerald-50 text-emerald-600' : 'bg-[#0070ba]/10 text-[#0070ba]'}`}>
                                {source}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-xs text-slate-600 font-medium text-center">{totalItems}</td>
                            <td className="py-4 px-4 text-sm font-black text-slate-900 text-right">₹{(tx.total_amount || 0).toLocaleString('en-IN')}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-sm italic text-slate-400">
                          {todaySearch ? 'No matching transactions found.' : 'No transactions found for today.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 space-y-6">
            
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h2 className="text-sm font-bold text-slate-700 mb-6 uppercase tracking-widest">Today's Channel Split</h2>
                {todayOfflineBillsCount > 0 || todayOnlineBillsCount > 0 ? (
                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-[#0070ba] uppercase tracking-widest">OFFLINE</span>
                        <span className="text-sm font-black text-slate-900">{todayOfflineBillsCount}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-[#0070ba] h-2.5 rounded-full transition-all duration-500" 
                          style={{ width: `${todayOfflineBillsCount + todayOnlineBillsCount > 0 ? (todayOfflineBillsCount / (todayOfflineBillsCount + todayOnlineBillsCount)) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">ONLINE</span>
                        <span className="text-sm font-black text-slate-900">{todayOnlineBillsCount}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500" 
                          style={{ width: `${todayOfflineBillsCount + todayOnlineBillsCount > 0 ? (todayOnlineBillsCount / (todayOfflineBillsCount + todayOnlineBillsCount)) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[80px]">
                    <p className="text-sm font-medium text-slate-600">No sales today.</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h2 className="text-sm font-bold text-slate-700 mb-6 uppercase tracking-widest">Today's Top Items</h2>
                {todayTopItems.length > 0 ? (
                  <div className="space-y-4">
                    {todayTopItems.map((item, idx) => (
                      <div key={idx} className="relative">
                        <div className="flex items-center gap-3 mb-1.5">
                          <span className="text-xs font-bold text-slate-400 w-3">{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            {item.isCustom && <div className="text-[9px] font-black text-[#0070ba] uppercase tracking-widest leading-none mb-0.5">CUSTOM</div>}
                            <span className="text-xs font-bold text-slate-700 block truncate">{item.name}</span>
                          </div>
                          <div className="flex flex-col items-end justify-center">
                            <span className="text-xs font-black text-[#0070ba]">₹{item.revenue.toLocaleString('en-IN')}</span>
                            <span className="text-[9px] text-slate-400">{item.qty} pcs</span>
                          </div>
                        </div>
                        <div className="w-full bg-transparent h-1.5 pl-6 pr-8">
                          <div className="bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-[#0070ba] h-1.5 rounded-full" style={{ width: `${(item.revenue / maxTodayItemRev) * 100}%` }}></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[80px]">
                      <p className="text-sm font-medium text-slate-600">No items sold today.</p>
                    </div>
                  )}
              </div>
            </div>
          </div>
          </>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'PRODUCTS' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full mb-8">
            <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-base font-black text-slate-800">Product Sales Leaderboard</h2>
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="Search product..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 pl-9 text-xs font-semibold focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="py-3 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Rank</th>
                    <th className="py-3 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Product Name</th>
                    <th className="py-3 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Qty Sold</th>
                    <th className="py-3 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Revenue</th>
                    <th className="py-3 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-48">Market Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {allProductsList
                    .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                    .map((item, idx) => {
                      const marketShare = totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-6">
                            <span className="text-xs font-bold text-slate-900">{idx + 1}</span>
                          </td>
                          <td className="py-3 px-6">
                            <span className="text-xs font-bold text-slate-800">{item.name}</span>
                          </td>
                          <td className="py-3 px-6 text-right">
                            <span className="text-xs font-bold text-slate-700">{item.qty} pcs</span>
                          </td>
                          <td className="py-3 px-6 text-right">
                            <span className="text-xs font-black text-[#0070ba]">₹{item.revenue.toLocaleString('en-IN')}</span>
                          </td>
                          <td className="py-3 px-6">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden flex-shrink-0">
                                <div className="bg-[#0070ba] h-1.5 rounded-full" style={{ width: `${marketShare}%` }}></div>
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 w-8 text-right">{marketShare}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                  })}
                  {allProductsList.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 font-medium text-xs">
                        No products found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* COUPONS TAB */}
        {activeTab === 'COUPONS' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Discount Summary (Left Column) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
              <h2 className="text-sm font-bold text-slate-700 mb-2">Discount Summary</h2>
              
              <div className="bg-[#FAF9F6] rounded-xl p-4 border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Discounts Given</span>
                  <span className="text-[#0070ba] font-bold">%</span>
                </div>
                <h3 className="text-2xl font-black text-[#0070ba]">₹{couponData.totalDiscountGiven.toLocaleString('en-IN')}</h3>
              </div>

              <div className="bg-[#FAF9F6] rounded-xl p-4 border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Discounted Orders</span>
                  <span className="text-blue-500 font-bold">📅</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900">{couponData.discountedOrders}</h3>
              </div>

              <div className="bg-[#FAF9F6] rounded-xl p-4 border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg Discount Per Order</span>
                  <span className="text-emerald-500 font-bold">₹</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900">₹{couponData.avgDiscountPerOrder.toLocaleString('en-IN')}</h3>
              </div>
            </div>

            {/* Promo Campaign Performance (Right Column) */}
            <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-sm font-bold text-slate-700">Promo Campaign Performance</h2>
                <div className="relative w-full sm:w-64">
                  <input 
                    type="text" 
                    placeholder="Search code/mobile/amount..." 
                    value={couponSearch}
                    onChange={e => setCouponSearch(e.target.value)}
                    className="pl-8 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs w-full outline-none focus:border-slate-400" 
                  />
                  <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead className="bg-[#FAF9F6] text-[10px] font-black text-slate-500 uppercase tracking-widest border-y border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Transaction ID</th>
                      <th className="py-3 px-4">Customer Mobile</th>
                      <th className="py-3 px-4 text-right">Order Total</th>
                      <th className="py-3 px-4 text-right">Discount Applied</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                      {filteredCoupons.length > 0 ? (
                        filteredCoupons.map((c, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-4">{c.id}</td>
                            <td className="py-4 px-4">{c.mobile}</td>
                            <td className="py-4 px-4 text-right">₹{c.total.toLocaleString('en-IN')}</td>
                            <td className="py-4 px-4 text-right text-[#0070ba]">-₹{c.discount}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500 font-medium">
                            No matching coupons found.
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Top Product Modal */}
      {isTopProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl relative">
            <button 
              onClick={() => setIsTopProductModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-lg font-black text-slate-900 mb-4">Top Products Details</h2>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {topItems.length > 0 ? topItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-[#0070ba] flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 truncate max-w-[180px]">{item.name}</h4>
                      <p className="text-xs text-slate-500">{item.qty} pcs sold</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-900">₹{item.revenue.toLocaleString('en-IN')}</span>
                </div>
              )) : (
                <p className="text-sm text-slate-500 text-center py-4">No products sold in this period.</p>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Metric Detail Modal */}
      {selectedMetric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl relative border border-slate-100">
            <button 
              onClick={() => setSelectedMetric(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-[#0070ba] flex items-center justify-center text-xl font-bold mb-4">
                {selectedMetric.icon}
              </div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedMetric.title}</h3>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 select-all break-all px-2">
                {selectedMetric.value}
              </p>
              <p className="text-xs font-medium text-slate-500 mt-3 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                {selectedMetric.description}
              </p>
            </div>
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setSelectedMetric(null)}
                className="w-full bg-[#0070ba] hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
