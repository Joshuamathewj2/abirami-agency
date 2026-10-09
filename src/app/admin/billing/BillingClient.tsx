'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { placeOrderAction } from '@/app/actions/orderActions';
import BillGeneratedView from '@/components/BillGeneratedView';
import { calculateTotals, InvoiceType, GstMode, PaymentMethod } from '@/lib/gst';

interface DBProduct {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  variants: {
    id: string;
    size_name: string;
    dimensions: string;
    price: number;
    stock: number;
    sku?: string;
  }[];
}

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  variantId?: string;
  productId?: string;
  imageUrl?: string;
}

export default function BillingClient() {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');

  // GST & Totals Engine State (Task 5)
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('non-gst');
  const [gstMode, setGstMode] = useState<GstMode>('inclusive');
  const [gstRate, setGstRate] = useState<number>(18);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  const [items, setItems] = useState<OrderItem[]>([{ name: '', price: 0, quantity: 1 }]);
  const [billingMode, setBillingMode] = useState<'offline' | 'online'>('offline');
  const [manualDiscountType, setManualDiscountType] = useState<'%' | 'flat'>('flat');
  const [manualDiscountValue, setManualDiscountValue] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  // Flat Searchable Product Catalog State (Task 4)
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [displayCount, setDisplayCount] = useState(40);

  // Database products & coupons state
  const [dbProducts, setDbProducts] = useState<DBProduct[]>([]);
  const [dbCoupons, setDbCoupons] = useState<any[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [orderFeedback, setOrderFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [generatedBill, setGeneratedBill] = useState<{
    invoiceId: string;
    grandTotal: number;
    subtotal: number;
    discountAmount: number;
    deliveryFee: number;
    amountReceived: number;
    balanceReturned: number;
    items: { name: string; quantity: number; unit?: string; price: number; total?: number }[];
    whatsappUrl: string;
    billingMode: 'offline' | 'online';
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    paymentMode: string;
    is_gst?: boolean;
    gst_rate?: number;
    taxable_amount?: number;
    cgst_amount?: number;
    sgst_amount?: number;
    customer_gstin?: string;
  } | null>(null);

  // Fetch products and coupons on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [mattressesResult, couponsResult, materialsResult] = await Promise.all([
          supabase
            .from('mattresses')
            .select(`
              id,
              name,
              is_active,
              materials ( name ),
              product_images!product_images_mattress_id_fkey ( image_url, is_primary ),
              variants!variants_mattress_id_fkey ( id, size_name, length, width, height, price, stock, sku )
            `)
            .eq('is_active', true),
          supabase
            .from('coupons')
            .select('id, code, percentage, flat_discount, min_order_value, max_discount, usage_limit, usage_count, expiry_date, is_active')
            .eq('is_active', true),
          supabase
            .from('materials')
            .select('name')
            .order('name', { ascending: true })
        ]);

        if (materialsResult.data) {
          setDbCategories(materialsResult.data.map((m: any) => m.name));
        }

        const mattresses = mattressesResult.data;
        const coupons = couponsResult.data;
        const mappedProducts: DBProduct[] = [];

        if (mattresses && mattresses.length > 0) {
          mattresses.forEach((m: any) => {
            const matName = m.materials?.name || 'Sanitaryware';
            const category = matName.charAt(0).toUpperCase() + matName.slice(1);

            const pImages = m.product_images || [];
            const primaryImg = pImages.find((img: any) => img.is_primary) || pImages[0];
            const imageUrl = primaryImg ? primaryImg.image_url : undefined;

            mappedProducts.push({
              id: m.id,
              name: m.name,
              category,
              imageUrl,
              variants: (m.variants || []).map((v: any) => ({
                id: v.id,
                size_name: v.size_name || 'Standard',
                dimensions: v.length > 0 ? `${v.length}" × ${v.width}"${v.height ? ` × ${v.height}"` : ''}` : 'Standard',
                price: Number(v.price),
                stock: v.stock || 0,
                sku: v.sku || ''
              }))
            });
          });
          setDbProducts(mappedProducts);
        } else {
          // Fallback to mock catalog
          const { products: mockProducts } = await import('@/lib/mock-data');
          const fallback = mockProducts.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category || 'Faucets',
            imageUrl: p.images?.[0] || p.thumbnail,
            variants: (p.sizes || []).map((s: any) => ({
              id: s.id,
              size_name: s.label || 'Standard',
              dimensions: s.dimensions || 'Standard',
              price: Number(s.price),
              stock: 50
            }))
          }));
          setDbProducts(fallback);
        }

        if (coupons) {
          setDbCoupons(coupons);
        }
      } catch (err) {
        console.error('POS Billing data load error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtered flat products with fuzzy search on name, category, size/variant and SKU
  const filteredCatalog = useMemo(() => {
    let result = dbProducts;

    if (selectedCategoryFilter && selectedCategoryFilter !== 'All') {
      result = result.filter(p => p.category.toLowerCase() === selectedCategoryFilter.toLowerCase());
    }

    if (productSearch.trim()) {
      const q = productSearch.toLowerCase().trim();
      result = result.filter(p => {
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesCat = p.category.toLowerCase().includes(q);
        const matchesVariant = p.variants.some(v =>
          v.size_name.toLowerCase().includes(q) ||
          v.dimensions.toLowerCase().includes(q) ||
          (v.sku && v.sku.toLowerCase().includes(q))
        );
        return matchesName || matchesCat || matchesVariant;
      });
    }

    return result;
  }, [dbProducts, selectedCategoryFilter, productSearch]);

  // Frequently sold / quick picks (first 4 products)
  const quickPicks = useMemo(() => {
    return dbProducts.slice(0, 4);
  }, [dbProducts]);

  const allCategories = useMemo(() => {
    const set = new Set(['All', ...dbCategories, ...dbProducts.map(p => p.category)]);
    return Array.from(set).filter(Boolean);
  }, [dbCategories, dbProducts]);

  // Add / Increment a catalog variant to current bill
  const handleAddVariantToBill = (product: DBProduct, variant: DBProduct['variants'][0]) => {
    const displayName = `${product.name} - ${variant.size_name} (${variant.dimensions})`;

    // Check if variant is already on the bill
    const existingIndex = items.findIndex(it => it.variantId === variant.id);

    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      setItems(updated);
    } else {
      // If first row is blank/empty custom item, replace it
      if (items.length === 1 && !items[0].name && items[0].price === 0) {
        setItems([{
          name: displayName,
          price: variant.price,
          quantity: 1,
          variantId: variant.id,
          productId: product.id,
          imageUrl: product.imageUrl,
        }]);
      } else {
        setItems([...items, {
          name: displayName,
          price: variant.price,
          quantity: 1,
          variantId: variant.id,
          productId: product.id,
          imageUrl: product.imageUrl,
        }]);
      }
    }
  };

  const addCustomItem = () => {
    setItems([...items, { name: '', price: 0, quantity: 1 }]);
  };

  const clearOrder = () => {
    if (confirm("Are you sure you want to clear this entire bill?")) {
      setItems([{ name: '', price: 0, quantity: 1 }]);
      setCustomerName('');
      setPhone('');
      setCustomerAddress('');
      setCustomerGstin('');
      setSelectedCoupon('');
      setManualDiscountValue(0);
      setDeliveryFee(0);
      setOrderFeedback(null);
    }
  };

  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value } as OrderItem;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    const filtered = items.filter((_, i) => i !== index);
    setItems(filtered.length > 0 ? filtered : [{ name: '', price: 0, quantity: 1 }]);
  };

  // Raw Subtotal from line items
  const rawSubtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);

  // Coupon calculations
  const activeCouponObj = dbCoupons.find(c => c.code === selectedCoupon);
  let couponDiscount = 0;
  let couponError = '';

  if (activeCouponObj) {
    if (activeCouponObj.min_order_value && rawSubtotal < activeCouponObj.min_order_value) {
      couponError = `Min order of ₹${activeCouponObj.min_order_value} required`;
    } else {
      if (activeCouponObj.percentage) {
        couponDiscount = (rawSubtotal * activeCouponObj.percentage) / 100;
        if (activeCouponObj.max_discount && couponDiscount > activeCouponObj.max_discount) {
          couponDiscount = activeCouponObj.max_discount;
        }
      } else if (activeCouponObj.flat_discount) {
        couponDiscount = activeCouponObj.flat_discount;
      }
    }
  }

  // Manual discount calculations
  let manualDiscount = 0;
  if (manualDiscountValue > 0) {
    if (manualDiscountType === '%') {
      manualDiscount = (rawSubtotal * manualDiscountValue) / 100;
    } else {
      manualDiscount = manualDiscountValue;
    }
  }

  // Unified GST and Totals Calculation via shared calculateTotals() utility
  const totals = calculateTotals({
    subtotal: rawSubtotal,
    couponDiscount,
    manualDiscount,
    deliveryFee,
    invoiceType,
    gstMode,
    gstRate,
  });

  const generateWhatsAppBill = async () => {
    setOrderFeedback(null);
    const validItems = items.filter(it => it.name.trim() && it.price >= 0);

    if (validItems.length === 0) {
      setOrderFeedback({ type: 'error', message: "Please add at least one item to the invoice." });
      return;
    }

    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    const isGst = invoiceType === 'gst';

    const em = {
      star: '⭐',
      bell: '🔔',
      person: '👤',
      phone: '📞',
      mobile: '📱',
      cart: '🛒',
      package: '📦',
      tag: '🏷️',
      money: '💰',
      truck: '🚚',
      sparkle: '✨',
    };

    let billSummaryText = `${em.star} *${isGst ? 'TAX INVOICE' : 'INVOICE'} FROM ABIRAMI AGENCY* ${em.bell}\n\n`;
    billSummaryText += `${em.person} *Customer Details:*\n`;
    billSummaryText += `${em.phone} Name: ${customerName || 'Valued Customer'}\n`;
    if (cleanPhone) billSummaryText += `${em.mobile} Mobile: ${cleanPhone}\n`;
    if (customerAddress.trim()) billSummaryText += `Address: ${customerAddress.trim()}\n`;
    if (isGst && customerGstin.trim()) billSummaryText += `GSTIN: ${customerGstin.trim()}\n`;
    billSummaryText += `\n${em.cart} *Items Purchased:*\n\n`;

    validItems.forEach((item, index) => {
      billSummaryText += `${em.package} ${index + 1}. ${item.name}\n   • Qty: ${item.quantity}\n   • Price: ₹${(item.price * item.quantity).toLocaleString('en-IN')}\n\n`;
    });

    billSummaryText += `${em.star} *Bill Summary:*\n`;
    billSummaryText += `• Subtotal: ₹${totals.subtotal.toLocaleString('en-IN')}\n`;
    if (totals.totalDiscount > 0) {
      billSummaryText += `• ${em.tag} Discount: -₹${totals.totalDiscount.toLocaleString('en-IN')}\n`;
    }
    if (totals.delivery > 0) {
      billSummaryText += `• ${em.truck} Delivery: ₹${totals.delivery.toLocaleString('en-IN')}\n`;
    }
    if (isGst) {
      billSummaryText += `• GST Mode: ${gstMode.toUpperCase()}\n`;
      billSummaryText += `• Taxable Value: ₹${totals.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
      billSummaryText += `• CGST (${(gstRate / 2).toFixed(1)}%): ₹${totals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
      billSummaryText += `• SGST (${(gstRate / 2).toFixed(1)}%): ₹${totals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
      billSummaryText += `• Total GST (+${gstRate}%): ₹${totals.gstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
    }
    billSummaryText += `• Payment: ${paymentMethod.toUpperCase()}\n`;
    billSummaryText += `\n${em.money} *Grand Total: ₹${totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}*\n\n`;
    billSummaryText += `Thank you for shopping with Abirami Agency! ${em.sparkle}`;

    const orderData = {
      customerName: customerName || 'Walk-in Customer',
      customerPhone: cleanPhone || 'Walk-in',
      customerAddress: customerAddress.trim() || `BILL TYPE: ${billingMode.toUpperCase()}`,
      address: customerAddress.trim(),
      couponId: activeCouponObj?.id || null,
      discountAmount: totals.totalDiscount,
      totalAmount: totals.grandTotal,
      amount_paid: totals.grandTotal,
      amount_received: totals.grandTotal,
      userId: null,
      status: 'Completed',
      paymentMethod: paymentMethod,
      notes: `${billSummaryText}\nINVOICE_TYPE: ${invoiceType}\nGST_MODE: ${gstMode}\nPAYMENT_METHOD: ${paymentMethod}\nDELIVERY_FEE: ${totals.delivery}`,
      is_gst: isGst,
      invoice_type: invoiceType,
      gst_mode: gstMode,
      gst_rate: isGst ? gstRate : 0,
      taxable_amount: totals.taxableAmount,
      cgst_amount: totals.cgst,
      sgst_amount: totals.sgst,
      gst_total: totals.gstTotal,
      delivery_charge: totals.delivery,
      customer_gstin: customerGstin.trim(),
      items: validItems.map(i => ({
        productId: i.variantId || 'CUSTOM',
        name: i.name,
        quantity: i.quantity,
        price: i.price
      }))
    };

    try {
      const res = await placeOrderAction(orderData);
      if (res.success && res.invoiceId) {
        const invoiceUrl = `${window.location.origin}/invoice/${res.invoiceId}`;
        const whatsappMessage = `Abirami Agency - Purchase Successful!\n\nHi ${customerName || 'Valued Customer'},\nThank you for shopping with us!\n\n${billSummaryText}\n\nView Digital Invoice: ${invoiceUrl}`;
        const targetPhoneParam = cleanPhone.length === 10 ? `phone=91${cleanPhone}&` : '';
        const whatsappUrl = `https://api.whatsapp.com/send/?${targetPhoneParam}text=${encodeURIComponent(whatsappMessage)}`;

        const currentItems = validItems.map(it => ({
          name: it.name,
          quantity: it.quantity,
          unit: 'piece',
          price: it.price,
          total: it.price * it.quantity,
        }));

        setGeneratedBill({
          invoiceId: res.invoiceId,
          grandTotal: totals.grandTotal,
          subtotal: totals.subtotal,
          discountAmount: totals.totalDiscount,
          deliveryFee: totals.delivery,
          amountReceived: totals.grandTotal,
          balanceReturned: 0,
          items: currentItems,
          whatsappUrl,
          billingMode,
          customerName: customerName || 'Walk-in Customer',
          customerPhone: cleanPhone || '',
          customerAddress: customerAddress.trim(),
          paymentMode: paymentMethod.toUpperCase(),
          is_gst: isGst,
          gst_rate: isGst ? gstRate : 0,
          taxable_amount: totals.taxableAmount,
          cgst_amount: totals.cgst,
          sgst_amount: totals.sgst,
          customer_gstin: customerGstin.trim(),
        });

        setOrderFeedback({
          type: 'success',
          message: `✓ Order & Invoice ${res.invoiceId} successfully created!`
        });
      } else {
        console.error('Failed to save order to DB:', res.error);
        setOrderFeedback({
          type: 'error',
          message: `Failed to save order: ${res.error || 'Server error'}. Please check details and try again.`
        });
      }
    } catch (err: any) {
      console.error('Order placement exception:', err);
      setOrderFeedback({
        type: 'error',
        message: `Failed to save order: ${err?.message || 'Server error'}. Please try again.`
      });
    }
  };

  const cleanPhoneInput = phone.replace(/[^0-9]/g, '');
  const isPhoneValid = cleanPhoneInput.length === 10;

  const handleNewSale = () => {
    setGeneratedBill(null);
    clearOrder();
  };

  if (generatedBill) {
    return (
      <BillGeneratedView
        invoiceId={generatedBill.invoiceId}
        grandTotal={generatedBill.grandTotal}
        subtotal={generatedBill.subtotal}
        discountAmount={generatedBill.discountAmount}
        deliveryFee={generatedBill.deliveryFee}
        amountReceived={generatedBill.amountReceived}
        balanceReturned={generatedBill.balanceReturned}
        items={generatedBill.items}
        whatsappUrl={generatedBill.whatsappUrl}
        onNewSale={handleNewSale}
        brandTitle="Abirami Agency"
        billingMode={generatedBill.billingMode}
        customerName={generatedBill.customerName}
        customerPhone={generatedBill.customerPhone}
        customerAddress={generatedBill.customerAddress}
        paymentMode={generatedBill.paymentMode}
        isGst={generatedBill.is_gst}
        gstRate={generatedBill.gst_rate}
        taxableAmount={generatedBill.taxable_amount}
        cgstAmount={generatedBill.cgst_amount}
        sgstAmount={generatedBill.sgst_amount}
        customerGstin={generatedBill.customer_gstin}
      />
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Parryware Billing POS
            </h1>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Direct Counter Sales, Instant GST Billing &amp; WhatsApp Invoicing
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Billing Channel Toggle */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setBillingMode('offline')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                billingMode === 'offline' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Counter POS
            </button>
            <button
              type="button"
              onClick={() => setBillingMode('online')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                billingMode === 'online' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Online / Site
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ────────────────── LEFT COLUMN: FLAT SEARCHABLE PRODUCT CATALOG (TASK 4) ────────────────── */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Flat Product Catalog
              </h2>
              <p className="text-[11px] font-semibold text-slate-400">
                {filteredCatalog.length} product{filteredCatalog.length !== 1 ? 's' : ''} available. Tap any variant to add.
              </p>
            </div>

            <button
              type="button"
              onClick={addCustomItem}
              className="text-xs bg-sky-50 hover:bg-sky-100 text-primary font-bold px-3 py-1.5 rounded-xl border border-sky-200 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>+ Custom Item</span>
            </button>
          </div>

          {/* Sticky Top Search Box */}
          <div className="sticky top-2 z-20 bg-white/95 backdrop-blur-md pt-1 pb-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products by name, category, size or SKU..."
                value={productSearch}
                onChange={e => {
                  setProductSearch(e.target.value);
                  setDisplayCount(40);
                }}
                className="w-full bg-slate-50 focus:bg-white text-xs md:text-sm text-slate-900 placeholder-slate-400 font-semibold rounded-2xl pl-10 pr-9 py-3 border border-slate-200 focus:border-sky-400 focus:ring-3 focus:ring-sky-100 outline-none transition-all shadow-2xs"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-500 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {productSearch && (
                <button
                  type="button"
                  onClick={() => setProductSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Horizontally Scrollable Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 mt-2 touch-manipulation">
              {allCategories.map(cat => {
                const isActive = selectedCategoryFilter.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryFilter(cat);
                      setDisplayCount(40);
                    }}
                    className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Picks / Frequent Products Section */}
          {!productSearch && selectedCategoryFilter === 'All' && quickPicks.length > 0 && (
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/70">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                Frequently Sold Products
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {quickPicks.map(p => {
                  const baseVariant = p.variants[0];
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => baseVariant && handleAddVariantToBill(p, baseVariant)}
                      className="bg-white p-2.5 rounded-xl border border-slate-200 hover:border-sky-300 text-left transition-all hover:shadow-xs group"
                    >
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-primary">
                        {p.name}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs font-black text-primary">
                          ₹{baseVariant?.price?.toLocaleString('en-IN') || 0}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                          + Add
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Flat Product List */}
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs font-bold animate-pulse">
              Loading Parryware Catalog...
            </div>
          ) : filteredCatalog.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">
              No products match &ldquo;{productSearch}&rdquo;. Try another filter or add a custom item.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCatalog.slice(0, displayCount).map(product => {
                return (
                  <div
                    key={product.id}
                    className="p-3.5 bg-white border border-slate-200/90 hover:border-sky-300 rounded-2xl transition-all shadow-2xs hover:shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-11 h-11 object-contain rounded-xl bg-slate-50 p-1 border border-slate-100 shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-sky-50 text-primary flex items-center justify-center font-black text-sm shrink-0 border border-sky-100">
                            P
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {product.name}
                          </h3>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            {product.category}
                          </span>
                        </div>
                      </div>

                      {/* If only 1 variant, show direct "+ Add" action */}
                      {product.variants.length === 1 && (
                        <button
                          type="button"
                          onClick={() => handleAddVariantToBill(product, product.variants[0])}
                          className="min-h-[36px] px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                        >
                          <span>+ Add</span>
                          <span>₹{product.variants[0].price.toLocaleString('en-IN')}</span>
                        </button>
                      )}
                    </div>

                    {/* Inline Variants as Chips (No modal required!) */}
                    {product.variants.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-2 items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Sizes / Variants:
                        </span>
                        {product.variants.map(variant => {
                          return (
                            <button
                              key={variant.id}
                              type="button"
                              onClick={() => handleAddVariantToBill(product, variant)}
                              className="px-2.5 py-1.5 bg-slate-50 hover:bg-sky-50 active:bg-sky-100 border border-slate-200 hover:border-sky-300 rounded-xl text-[11px] font-semibold text-slate-700 hover:text-primary transition-all flex items-center gap-1.5 shadow-2xs"
                              title={`Add ${variant.size_name}`}
                            >
                              <span className="font-bold">{variant.size_name}</span>
                              <span className="text-slate-400">|</span>
                              <span className="font-black text-slate-900">₹{variant.price.toLocaleString('en-IN')}</span>
                              <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1 rounded font-bold">+</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredCatalog.length > displayCount && (
                <button
                  type="button"
                  onClick={() => setDisplayCount(prev => prev + 40)}
                  className="w-full py-2.5 text-center text-xs font-bold text-primary bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Load More Products ({filteredCatalog.length - displayCount} remaining)
                </button>
              )}
            </div>
          )}
        </div>

        {/* ────────────────── RIGHT COLUMN: INVOICE & GST CONTROLS (TASK 5) ────────────────── */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-5">
          {/* Customer Details Box */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Customer Info
            </h2>

            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Walk-in Customer / Business Name"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:border-sky-400 focus:outline-none bg-slate-50/50"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Mobile Number
                  </label>
                  {phone && (
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${isPhoneValid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {isPhoneValid ? '✓ 10 Digits' : '10 Digits'}
                    </span>
                  )}
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:border-sky-400 focus:outline-none bg-slate-50/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Delivery / Billing Address (Optional)
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  placeholder="Chennai, Tamil Nadu..."
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:border-sky-400 focus:outline-none bg-slate-50/50"
                />
              </div>

              {invoiceType === 'gst' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Customer GSTIN
                  </label>
                  <input
                    type="text"
                    value={customerGstin}
                    onChange={e => setCustomerGstin(e.target.value.toUpperCase())}
                    placeholder="33AAAAA0000A1Z5"
                    className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-200 focus:border-sky-400 focus:outline-none uppercase font-mono bg-slate-50/50"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Current Bill Items Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Current Bill ({items.filter(it => it.name.trim()).length} items)
              </h2>
              <button
                type="button"
                onClick={clearOrder}
                className="text-[11px] text-rose-500 hover:text-rose-700 font-bold"
              >
                Clear All
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
              {items.map((item, idx) => {
                const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
                return (
                  <div key={idx} className="py-2.5 space-y-1.5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => updateItem(idx, 'name', e.target.value)}
                        placeholder="Item name / description..."
                        className="flex-1 text-xs font-bold text-slate-800 bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-sky-400 outline-none pb-0.5"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-md"
                        title="Remove item"
                      >
                        &times;
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      {/* Price & Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-bold">₹</span>
                          <input
                            type="number"
                            value={item.price === 0 ? '' : item.price}
                            onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                            className="w-16 px-1.5 py-0.5 text-xs font-bold border border-slate-200 rounded-lg text-slate-800"
                            placeholder="0"
                            min="0"
                          />
                        </div>

                        {/* Qty +/- */}
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                          <button
                            type="button"
                            onClick={() => updateItem(idx, 'quantity', Math.max(1, item.quantity - 1))}
                            className="w-6 h-6 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200"
                          >
                            -
                          </button>
                          <span className="w-7 text-center font-bold text-xs text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateItem(idx, 'quantity', item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Line Total */}
                      <span className="font-black text-slate-900">
                        ₹{lineTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ────────────────── PROPER GST ENGINE CONTROLS (TASK 5) ────────────────── */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              GST &amp; Financials
            </h2>

            {/* Toggle: NON-GST BILL vs GST INVOICE */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setInvoiceType('non-gst')}
                className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  invoiceType === 'non-gst' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Non-GST Bill
              </button>
              <button
                type="button"
                onClick={() => setInvoiceType('gst')}
                className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  invoiceType === 'gst' ? 'bg-primary text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                GST Invoice
              </button>
            </div>

            {/* In GST Mode: Exclusive / Inclusive switch & Editable Rate */}
            {invoiceType === 'gst' && (
              <div className="p-3.5 bg-sky-50/70 border border-sky-100 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Calculation Mode:
                  </span>
                  <div className="inline-flex p-0.5 bg-white border border-sky-200 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setGstMode('inclusive')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                        gstMode === 'inclusive' ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Inclusive (TAX INCL.)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGstMode('exclusive')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                        gstMode === 'exclusive' ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Exclusive (+GST)
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700">GST Rate:</span>
                  <div className="flex items-center gap-1.5 bg-white border border-sky-200 px-2 py-1 rounded-xl">
                    <input
                      type="number"
                      value={gstRate}
                      onChange={e => setGstRate(Math.max(0, Number(e.target.value) || 0))}
                      className="w-10 text-right font-black text-slate-900 outline-none text-xs"
                      min="0"
                      max="100"
                    />
                    <span className="text-slate-400 font-bold">%</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-sky-200/60 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">
                    GST Total (+{gstRate}%):
                  </span>
                  <span className="font-black text-primary">
                    ₹{totals.gstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 bg-white/70 p-2 rounded-xl">
                  <div>
                    <span className="font-bold text-slate-700">CGST ({(gstRate / 2).toFixed(1)}%):</span> ₹{totals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">SGST ({(gstRate / 2).toFixed(1)}%):</span> ₹{totals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            )}

            {/* Financial Options (Payment Methods) */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Financial Option:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'cash', label: 'Cash' },
                  { id: 'gpay', label: 'GPay / UPI' },
                ].map(pm => {
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase text-center transition-all ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {pm.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Discounts and Delivery Fee */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Manual Discount
                </label>
                <div className="flex items-center gap-1">
                  <select
                    value={manualDiscountType}
                    onChange={e => setManualDiscountType(e.target.value as any)}
                    className="bg-slate-50 text-xs font-bold border border-slate-200 rounded-lg px-1.5 py-1.5"
                  >
                    <option value="flat">₹</option>
                    <option value="%">%</option>
                  </select>
                  <input
                    type="number"
                    value={manualDiscountValue === 0 ? '' : manualDiscountValue}
                    onChange={e => setManualDiscountValue(Math.max(0, Number(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full px-2 py-1.5 text-xs font-bold border border-slate-200 rounded-lg bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Delivery Fee (₹)
                </label>
                <input
                  type="number"
                  value={deliveryFee === 0 ? '' : deliveryFee}
                  onChange={e => setDeliveryFee(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full px-2 py-1.5 text-xs font-bold border border-slate-200 rounded-lg bg-slate-50"
                />
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs font-medium text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-900">₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {totals.totalDiscount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span className="font-bold">-₹{totals.totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {totals.delivery > 0 && (
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span className="font-bold text-slate-900">+₹{totals.delivery.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {invoiceType === 'gst' && (
                <div className="flex justify-between text-slate-500">
                  <span>Taxable Value:</span>
                  <span className="font-bold text-slate-900">₹{totals.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-base">
                <span className="font-black text-slate-900">Grand Total:</span>
                <span className="text-xl font-black text-primary">
                  ₹{totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {orderFeedback && (
              <div className={`p-3 rounded-xl text-xs font-bold ${orderFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                {orderFeedback.message}
              </div>
            )}

            {/* Complete Sale Button */}
            <button
              type="button"
              onClick={generateWhatsAppBill}
              className="w-full min-h-[48px] bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black py-3.5 px-6 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.128.552 4.195 1.6 6.02L.031 24l6.108-1.597c1.764.954 3.754 1.458 5.892 1.458 6.646 0 12.031-5.385 12.031-12.031C24 5.385 18.677 0 12.031 0zm0 21.854c-1.802 0-3.568-.485-5.114-1.403l-.367-.217-3.794.994.994-3.794-.217-.367C2.569 15.539 2.083 13.785 2.083 12.031c0-5.498 4.475-9.972 9.948-9.972 5.497 0 9.947 4.474 9.947 9.972s-4.45 9.823-9.947 9.823zm5.45-7.447c-.299-.15-1.765-.87-2.036-.97-.272-.1-.47-.15-.668.15-.2.299-.77 1-.944 1.2-.175.2-.349.225-.648.075-.299-.15-1.26-.464-2.4-1.485-.888-.795-1.487-1.776-1.663-2.075-.175-.3 0-.462.15-.61.135-.135.299-.35.45-.525.15-.174.2-.299.299-.499.1-.2.05-.375-.025-.525-.075-.15-.668-1.611-.914-2.204-.239-.58-.484-.502-.668-.511-.174-.01-.375-.01-.575-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.074 2.898 1.224 3.098c.15.2 2.112 3.22 5.114 4.516.715.309 1.272.493 1.706.63.722.228 1.38.196 1.897.119.58-.087 1.765-.722 2.014-1.42.249-.698.249-1.298.174-1.42-.075-.123-.274-.198-.574-.348z" />
              </svg>
              <span>COMPLETE SALE &amp; INVOICE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
