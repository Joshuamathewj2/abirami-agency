'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { placeOrderAction } from '@/app/actions/orderActions';

interface DBProduct {
  id: string;
  name: string;
  category: string; // 'Foam' | 'Coir' | 'Spring' | 'Latex' | 'Pillows' | 'Bedspreads' | 'Other'
  imageUrl?: string;
  variants: {
    id: string;
    size_name: string;
    dimensions: string;
    price: number;
    stock: number;
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
  const [items, setItems] = useState<OrderItem[]>([{ name: '', price: 0, quantity: 1 }]);
  const [billingMode, setBillingMode] = useState<'offline' | 'online'>('offline');
  const [manualDiscountType, setManualDiscountType] = useState<'%' | 'flat'>('flat');
  const [manualDiscountValue, setManualDiscountValue] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [amountReceived, setAmountReceived] = useState<number>(0);

  // Database products & coupons state
  const [dbProducts, setDbProducts] = useState<DBProduct[]>([]);
  const [dbCoupons, setDbCoupons] = useState<any[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal Step Wizard States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalItemIndex, setModalItemIndex] = useState<number | null>(null);
  const [modalStep, setModalStep] = useState<'category' | 'product' | 'variant'>('category');
  const [modalSelectedCategory, setModalSelectedCategory] = useState<string | null>(null);
  const [modalSelectedProduct, setModalSelectedProduct] = useState<DBProduct | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalSelectedSizeName, setModalSelectedSizeName] = useState<string>('');
  const [modalSelectedVariantId, setModalSelectedVariantId] = useState<string>('');
  const [modalSelectedColor, setModalSelectedColor] = useState<string>('');

  // Fetch products and coupons on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch Mattresses & variants
        const { data: mattresses } = await supabase
          .from('mattresses')
          .select(`
            *,
            materials ( name ),
            product_images ( image_url, is_primary ),
            variants ( id, size_name, length, width, height, price, stock )
          `)
          .eq('is_active', true);

        const mappedProducts: DBProduct[] = [];

        if (mattresses) {
          mattresses.forEach((m: any) => {
            const matName = m.materials?.name || 'Other';
            // Use material name directly as category (capitalize first letter)
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
                dimensions: `${v.length}" × ${v.width}"${v.height ? ` × ${v.height}"` : ''}`,
                price: Number(v.price),
                stock: v.stock || 0
              }))
            });
          });
        }

        setDbProducts(mappedProducts);

        // 2. Fetch active coupons
        const { data: coupons } = await supabase
          .from('coupons')
          .select('*')
          .eq('is_active', true);
        
        if (coupons) {
          const now = new Date();
          const validCoupons = coupons.filter((c: any) => {
            if (c.expiry_date) {
              const expiry = new Date(c.expiry_date);
              expiry.setHours(23, 59, 59, 999);
              if (expiry < now) return false;
            }
            if (c.usage_limit && c.usage_count !== null && c.usage_count >= c.usage_limit) return false;
            return true;
          });
          setDbCoupons(validCoupons);
        }
      } catch (err) {
        console.error('Error fetching billing data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const addCustomItem = () => {
    setItems([...items, { name: '', price: 0, quantity: 1 }]);
  };

  const clearOrder = () => {
    if (confirm("Are you sure you want to clear this entire order?")) {
      setItems([{ name: '', price: 0, quantity: 1 }]);
      setCustomerName('');
      setPhone('');
      setSelectedCoupon('');
      setManualDiscountValue(0);
      setDeliveryFee(0);
      setAmountReceived(0);
    }
  };

  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value } as OrderItem;
    setItems(newItems);
  };

  // Batch update helper for product catalog selections to avoid asynchronous state race conditions
  const selectProductVariant = (index: number, productName: string, variant: any, productId: string, imageUrl?: string, color?: string) => {
    // Format name and dimensions on separate lines (\n)
    const colorStr = color ? ` - Color: ${color}` : '';
    const displayName = `${productName}${colorStr}\n${variant.size_name} (${variant.dimensions})`;
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      name: displayName,
      price: variant.price,
      variantId: variant.id,
      productId: productId,
      imageUrl: imageUrl
    };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    const filtered = items.filter((_, i) => i !== index);
    setItems(filtered.length > 0 ? filtered : [{ name: '', price: 0, quantity: 1 }]);
  };

  // Modal handlers
  const openModal = (index: number) => {
    setModalItemIndex(index);
    setModalStep('category');
    setModalSelectedCategory(null);
    setModalSelectedProduct(null);
    setModalSearchQuery('');
    setModalSelectedSizeName('');
    setModalSelectedVariantId('');
    setModalSelectedColor('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalItemIndex(null);
    setModalStep('category');
    setModalSelectedCategory(null);
    setModalSelectedProduct(null);
    setModalSearchQuery('');
    setModalSelectedSizeName('');
    setModalSelectedVariantId('');
    setModalSelectedColor('');
  };

  const handleModalBack = () => {
    if (modalStep === 'variant') {
      setModalStep('product');
      setModalSelectedProduct(null);
    } else if (modalStep === 'product') {
      setModalStep('category');
      setModalSelectedCategory(null);
    }
  };

  // Helper to fetch category icons
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'foam':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2" />
          </svg>
        );
      case 'coir':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        );
      case 'spring':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'latex':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        );
      case 'pillows':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      case 'bedspreads':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
    }
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const activeCouponObj = dbCoupons.find(c => c.code === selectedCoupon);
  let discountAmount = 0;
  let couponError = '';

  if (activeCouponObj) {
    if (activeCouponObj.min_order_value && subtotal < activeCouponObj.min_order_value) {
      couponError = `Min order of ₹${activeCouponObj.min_order_value} required`;
    } else {
      if (activeCouponObj.percentage) {
        discountAmount = (subtotal * activeCouponObj.percentage) / 100;
        if (activeCouponObj.max_discount && discountAmount > activeCouponObj.max_discount) {
          discountAmount = activeCouponObj.max_discount;
        }
      } else if (activeCouponObj.flat_discount) {
        discountAmount = activeCouponObj.flat_discount;
      }
    }
  }

  // Calculate manual discount
  let manualDiscountAmount = 0;
  if (manualDiscountValue > 0) {
    if (manualDiscountType === '%') {
      manualDiscountAmount = (subtotal * manualDiscountValue) / 100;
    } else {
      manualDiscountAmount = manualDiscountValue;
    }
  }

  const totalDiscount = discountAmount + manualDiscountAmount;
  const finalTotal = Math.max(0, subtotal - totalDiscount) + deliveryFee;

  const generateWhatsAppBill = async () => {
    if (!phone) {
      alert("Please enter the customer's WhatsApp number.");
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    
    const em = {
      star:     String.fromCodePoint(0x2B50),
      bell:     String.fromCodePoint(0x1F514),
      person:   String.fromCodePoint(0x1F464),
      phone:    String.fromCodePoint(0x1F4DE),
      mobile:   String.fromCodePoint(0x1F4F1),
      cart:     String.fromCodePoint(0x1F6D2),
      package:  String.fromCodePoint(0x1F4E6),
      tag:      String.fromCodePoint(0x1F516),
      dollar:   String.fromCodePoint(0x1F4B5),
      ticket:   String.fromCodePoint(0x1F3AB),
      money:    String.fromCodePoint(0x1F4B0),
      truck:    String.fromCodePoint(0x1F69A),
      sparkle:  String.fromCodePoint(0x2728),
    };

    // We still generate the full invoice details note for db storage!
    let dbNotes = `${em.star} *INVOICE FROM ABIRAMI AGENCY* ${em.bell}\n\n`;
    dbNotes += `${em.person} *Customer Details:*\n`;
    dbNotes += `${em.phone} Name: ${customerName || 'Valued Customer'}\n`;
    dbNotes += `${em.mobile} Mobile: ${phone}\n\n`;
    dbNotes += `${em.cart} *Items Ordered:*\n\n`;
    
    let validItemCount = 0;
    items.forEach((item) => {
      if (item.name) {
        validItemCount++;
        const formattedName = item.name.split('\n').map((line, i) => i === 0 ? line : `   ${line}`).join('\n');
        dbNotes += `${em.package} ${validItemCount}. ${formattedName}\n   \u2022 Qty: ${item.quantity}\n   \u2022 ${em.dollar} \u20B9${(item.price * item.quantity).toLocaleString('en-IN')}\n\n`;
      }
    });

    if (validItemCount === 0) {
      alert("Please add at least one item to the invoice.");
      return;
    }
    
    dbNotes += `${em.star} *Bill Summary:*\n`;
    dbNotes += `\u2022 Subtotal: \u20B9${subtotal.toLocaleString('en-IN')}\n`;
    if (activeCouponObj && discountAmount > 0) {
      dbNotes += `\u2022 ${em.ticket} Coupon: ${activeCouponObj.code} (-\u20B9${discountAmount.toLocaleString('en-IN')})\n`;
    }
    if (manualDiscountAmount > 0) {
      dbNotes += `\u2022 ${em.tag} Discount: -\u20B9${manualDiscountAmount.toLocaleString('en-IN')}\n`;
    }
    if (deliveryFee > 0) {
      dbNotes += `\u2022 ${em.truck} Delivery: \u20B9${deliveryFee.toLocaleString('en-IN')}\n`;
    }
    dbNotes += `\n${em.money} *Total Amount: \u20B9${finalTotal.toLocaleString('en-IN')}*\n\n`;
    dbNotes += `Thank you for choosing Abirami Agency! ${em.sparkle}`;

    // Open a blank tab immediately to prevent popup blocking
    const newTab = window.open('about:blank', '_blank');

    const orderData = {
      customerName: customerName || 'Walk-in Customer',
      customerPhone: cleanPhone,
      customerAddress: `BILL TYPE: ${billingMode.toUpperCase()}`,
      couponId: activeCouponObj?.id || null,
      discountAmount: totalDiscount,
      totalAmount: finalTotal,
      userId: null,
      status: 'Completed',
      notes: `${dbNotes}\nBILL TYPE: ${billingMode.toUpperCase()}`,
      items: items.map(i => ({
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
        const whatsappMessage = `Abirami Agency- Purchase Successful!\n\nHi ${customerName || 'Valued Customer'},\nThank you for shopping with us! You can view, download, or print your official digital invoice here:\n\n${invoiceUrl}\n\nHave a great day!`;
        const whatsappUrl = `https://api.whatsapp.com/send/?phone=91${cleanPhone}&text=${encodeURIComponent(whatsappMessage)}`;
        
        if (newTab) {
          newTab.location.href = whatsappUrl;
        } else {
          window.open(whatsappUrl, '_blank');
        }
      } else {
        if (newTab) newTab.close();
        alert(res.error || "Failed to save POS order.");
      }
    } catch (err) {
      console.error("Failed to save POS order", err);
      if (newTab) newTab.close();
      alert("Failed to save POS order.");
    }

    // Clear form automatically for the next bill
    setItems([{ name: '', price: 0, quantity: 1 }]);
    setCustomerName('');
    setPhone('');
    setSelectedCoupon('');
    setManualDiscountValue(0);
    setDeliveryFee(0);
    setAmountReceived(0);
  };

  const categoriesList = [...new Set(dbProducts.map(p => p.category))].sort();
  const cleanPhoneInput = phone.replace(/[^0-9]/g, '');
  const isPhoneValid = cleanPhoneInput.length === 10;

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-8">
      {/* Title & Mode Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-6 bg-sky-500 rounded-full inline-block shadow-[0_0_15px_rgba(14,165,233,0.5)]"></span>
            POS Billing Panel
          </h1>
          <p className="text-gray-500 text-xs hidden sm:block border-l pl-3 ml-1 mt-1 font-medium">Quick invoice generator & database synced checkout</p>
        </div>
        
        {/* Toggle Mode in Upper Right */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-300/80 shadow-inner shrink-0">
          <button
            onClick={() => setBillingMode('offline')}
            className={`px-3 py-1.5 rounded-lg font-extrabold text-[10px] md:text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
              billingMode === 'offline'
                ? 'bg-white text-gray-900 shadow-md border border-gray-200/50'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <span className={`w-2 h-2 rounded-full bg-sky-500 ${billingMode === 'offline' ? 'animate-pulse' : ''}`} />
            Offline (POS)
          </button>
          <button
            onClick={() => setBillingMode('online')}
            className={`px-3 py-1.5 rounded-lg font-extrabold text-[10px] md:text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
              billingMode === 'online'
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <span className={`w-2 h-2 rounded-full bg-green-500 ${billingMode === 'online' ? 'animate-pulse' : ''}`} />
            Online Order
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Customer & Invoice Builder (Spans 8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Customer Card */}
          <div className="bg-white p-6 rounded-3xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2.5">
              <svg className="w-5.5 h-5.5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Customer Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full border border-gray-300 bg-gray-50/50 rounded-xl px-4 py-3.5 text-sm md:text-base focus:ring-2 focus:ring-sky-500/20 focus:bg-white outline-none transition-all font-semibold"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                  <span>Mobile Number (WhatsApp)</span>
                  {phone && (
                    <span className={`text-[10px] font-extrabold tracking-normal normal-case px-1.5 py-0.5 rounded-full ${
                      isPhoneValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {isPhoneValid ? 'Valid 10 Digits' : 'Need 10 Digits'}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 10) {
                        setPhone(val);
                      }
                    }}
                    className={`w-full border border-gray-300 rounded-xl px-4 py-3.5 pr-10 text-sm md:text-base outline-none transition-all font-semibold ${
                      isPhoneValid ? 'bg-green-50/50 focus:ring-2 focus:ring-green-500/20' : 'bg-gray-50/50 focus:ring-2 focus:ring-red-500/20 focus:bg-white'
                    }`}
                    placeholder="Enter 10-digit number"
                  />
                  {isPhoneValid && (
                    <span className="absolute right-3.5 top-4.5 text-green-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Items Card */}
          <div className="bg-white p-6 rounded-3xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-100 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2.5">
                <svg className="w-5.5 h-5.5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Order Items
              </h2>
              <div className="flex gap-2 justify-end w-full sm:w-auto">
                <button
                  onClick={clearOrder}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-3.5 py-2 rounded-xl transition-all border border-gray-200"
                >
                  Clear Order
                </button>
                <button
                  onClick={addCustomItem}
                  className="text-xs md:text-sm bg-sky-50 text-sky-600 font-bold px-4 py-2 rounded-xl hover:bg-sky-100 transition-all flex items-center gap-1.5 shadow-sm border border-sky-200"
                >
                  + Add Custom Item
                </button>
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              {items.map((item, index) => {
                const isCatalogProduct = !!item.variantId;
                return (
                  <div 
                    key={index} 
                    className={`flex flex-col sm:flex-row gap-4 items-start p-4 rounded-2xl transition-all ${
                      isCatalogProduct 
                        ? 'bg-sky-50/30 border border-sky-100' 
                        : 'bg-gray-50/50 border border-gray-100'
                    }`}
                  >

                    {/* Catalog Selector Layout */}
                    <div className="flex-1 w-full">
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                        Item Name / Description
                        {isCatalogProduct && (
                          <span className="text-[9px] font-bold text-sky-600 uppercase tracking-widest bg-sky-100 px-1.5 py-0.5 rounded-full">
                            Catalog Synced
                          </span>
                        )}
                      </label>
                      <div className="flex gap-2 relative items-start">
                        <textarea
                          value={item.name}
                          onChange={e => {
                            updateItem(index, 'name', e.target.value);
                            if (item.variantId) {
                              updateItem(index, 'variantId', '');
                              updateItem(index, 'productId', '');
                              updateItem(index, 'imageUrl', '');
                            }
                          }}
                          className="flex-1 border border-gray-300 bg-white shadow-sm rounded-xl px-3 py-2 text-xs md:text-sm font-semibold focus:ring-2 focus:ring-sky-500/20 outline-none transition-all resize-none h-[64px]"
                          placeholder="Type custom product description..."
                          rows={2}
                        />
                        <button
                          type="button"
                          onClick={() => openModal(index)}
                          className="px-3.5 py-3.5 bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-200 rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors"
                          title="Select Product from Database Catalog"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h7" />
                          </svg>
                          Catalog
                        </button>
                      </div>
                    </div>

                    {/* Price, Qty and Delete Row */}
                    <div className="flex items-end gap-3 w-full sm:w-auto">
                      {/* Price Input */}
                      <div className="flex-1 sm:w-28">
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Price (₹)</label>
                        <input
                          type="number"
                          value={item.price === 0 ? '' : item.price}
                          onChange={e => updateItem(index, 'price', Number(e.target.value))}
                          onWheel={(e) => (e.target as HTMLInputElement).blur()}
                          className="w-full border border-gray-300 bg-white shadow-sm rounded-xl px-3 py-2.5 text-xs md:text-sm font-extrabold focus:ring-2 focus:ring-sky-500/20 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          min="0"
                        />
                      </div>

                      {/* Quantity Selector */}
                      <div className="w-24 sm:w-28 shrink-0">
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Qty</label>
                        <div className="flex items-center h-[38px] md:h-[42px] bg-white shadow-sm border border-sky-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-sky-500/20">
                          <button
                            type="button"
                            onClick={() => updateItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                            className="w-8 sm:w-9 h-full hover:bg-sky-50 flex items-center justify-center text-sm font-bold border-r border-sky-100 text-sky-600"
                          >
                            -
                          </button>
                          <span className="flex-1 text-center text-xs md:text-sm font-bold text-gray-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateItem(index, 'quantity', item.quantity + 1)}
                            className="w-8 sm:w-9 h-full hover:bg-sky-50 flex items-center justify-center text-sm font-bold border-l border-sky-100 text-sky-600"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Remove Action Button */}
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2.5 text-sky-500 bg-sky-50 hover:bg-sky-100 hover:text-sky-700 rounded-xl transition-colors border border-sky-100 mb-[1px] shrink-0"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Invoice Receipt Preview (Spans 4 columns) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.08)] ring-1 ring-gray-100 overflow-hidden sticky top-20">
            
            <div className="p-4 space-y-4">
              {/* Receipt Info details */}
              <div className="space-y-2 text-xs md:text-sm font-semibold text-gray-600 bg-gray-50/80 p-3 rounded-2xl border border-gray-200 relative">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 uppercase tracking-wider text-[10px]">Source</span>
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                    billingMode === 'online' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-sky-100 text-sky-700 border-sky-200'
                  }`}>
                    {billingMode}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200/50 pt-2.5">
                  <span className="text-gray-400 uppercase tracking-wider text-[10px]">Customer</span>
                  <span className="text-gray-900 font-extrabold truncate max-w-[140px]">{customerName || '-'}</span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200/50 pt-2.5">
                  <span className="text-gray-400 uppercase tracking-wider text-[10px]">Phone</span>
                  <span className="text-gray-900 font-extrabold">{phone || '-'}</span>
                </div>
              </div>

              {/* List of items in preview with clean spacing */}
              <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                {items.some(it => it.name) ? (
                  items.map((item, index) => item.name ? (
                    <div key={index} className="flex gap-2 items-start text-xs border-b border-gray-100 pb-2">
                      {item.imageUrl && (
                        <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                          <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="text-gray-800 pr-3 min-w-0 flex-1">
                        <span className="text-gray-400 font-bold mr-2 inline-block align-top">{item.quantity}x</span>
                        <span className="font-semibold text-gray-700 inline-block align-top whitespace-pre-line leading-relaxed text-xs md:text-sm">{item.name}</span>
                      </div>
                      <div className="font-extrabold text-gray-900 shrink-0 align-top">₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                    </div>
                  ) : null)
                ) : (
                  <p className="text-center py-4 text-xs font-semibold text-gray-400">No items added yet</p>
                )}
              </div>

              {/* Coupon Code Input/Selection */}
              <div className="border-t border-dashed border-gray-300 pt-4">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Apply Coupon</label>
                <div className="flex gap-2">
                  <select
                    value={selectedCoupon}
                    onChange={e => setSelectedCoupon(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  >
                    <option value="">No Coupon</option>
                    {dbCoupons.map(coupon => (
                      <option key={coupon.id} value={coupon.code}>
                        {coupon.code} ({coupon.percentage ? `${coupon.percentage}% off` : `₹${coupon.flat_discount} off`})
                      </option>
                    ))}
                  </select>
                  {selectedCoupon && (
                    <button
                      onClick={() => setSelectedCoupon('')}
                      className="px-3.5 py-2.5 text-xs md:text-sm font-bold bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl transition-colors border border-gray-200"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {couponError && (
                  <p className="text-xs text-red-500 font-bold mt-1.5">{couponError}</p>
                )}
              </div>

              {/* Manual Discount */}
              <div className="border-t border-dashed border-gray-300 pt-4 space-y-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Manual Discount</label>
                <div className="flex gap-2">
                  <select
                    value={manualDiscountType}
                    onChange={(e) => {
                      const type = e.target.value as any;
                      setManualDiscountType(type);
                      if (type === '%' && manualDiscountValue > 100) {
                        setManualDiscountValue(100);
                      }
                    }}
                    className="w-20 bg-white border border-sky-200 rounded-xl px-2 py-2 text-sm font-semibold focus:ring-2 focus:ring-sky-500/20 outline-none"
                  >
                    <option value="%">%</option>
                    <option value="flat">₹</option>
                  </select>
                  <input
                    type="number"
                    value={manualDiscountValue === 0 ? '' : manualDiscountValue}
                    onChange={(e) => {
                      let val = Number(e.target.value);
                      if (manualDiscountType === '%' && val > 100) val = 100;
                      setManualDiscountValue(val);
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    placeholder="0"
                    max={manualDiscountType === '%' ? 100 : undefined}
                    className="flex-1 bg-white border border-sky-200 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-sky-500/20 outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                {manualDiscountAmount > 0 && (
                  <div className="text-[10px] font-extrabold text-green-700 mt-1">
                    Discount: -₹{manualDiscountAmount.toLocaleString('en-IN')}
                  </div>
                )}
              </div>

              {/* Price Calculations styled like a receipt */}
              <div className="border-t border-dashed border-gray-300 pt-4 space-y-3.5 text-xs md:text-sm">
                <div className="flex justify-between font-semibold text-gray-500">
                  <span>Subtotal ({items.reduce((acc, it) => acc + (it.name ? it.quantity : 0), 0)} items)</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {activeCouponObj && discountAmount > 0 && (
                  <div className="flex justify-between font-extrabold text-green-700">
                    <span>Coupon ({activeCouponObj.code})</span>
                    <span>- ₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {manualDiscountAmount > 0 && (
                  <div className="flex justify-between font-extrabold text-green-700">
                    <span>Discount ({manualDiscountType === '%' ? `${manualDiscountValue}%` : 'Flat'})</span>
                    <span>- ₹{manualDiscountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-semibold text-gray-500 items-center">
                  <span>Delivery</span>
                  <input 
                    type="number" 
                    value={deliveryFee === 0 ? '' : deliveryFee} 
                    onChange={e => setDeliveryFee(Number(e.target.value))}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    placeholder="0"
                    className="w-20 bg-white border border-gray-300 rounded-lg px-2 py-1 text-right focus:ring-2 focus:ring-sky-500/20 outline-none font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                  <span className="font-extrabold text-gray-900 text-base uppercase tracking-wider">Grand Total</span>
                  <span className="font-black text-gray-900 text-xl">₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Cash Payment */}
              <div className="border border-gray-200 bg-gray-50/50 rounded-2xl p-4 mt-2">
                <h4 className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">Cash Payment</h4>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Amount Received (₹)</label>
                <input
                  type="number"
                  value={amountReceived === 0 ? '' : amountReceived}
                  onChange={(e) => setAmountReceived(Number(e.target.value))}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  placeholder="0.00"
                  className="w-full bg-white border border-sky-200 rounded-xl px-4 py-3 text-lg font-black text-gray-800 focus:ring-2 focus:ring-sky-500/20 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                {amountReceived > 0 && (
                  <div className="mt-3 flex justify-between items-center text-sm">
                    <span className="font-bold text-gray-500">Balance:</span>
                    <span className={`font-black ${amountReceived >= finalTotal ? 'text-green-600' : 'text-red-500'}`}>
                      ₹{(amountReceived - finalTotal).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>

              {/* Large CTA Button */}
              <button
                onClick={generateWhatsAppBill}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-extrabold py-4 px-6 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2.5 text-xs md:text-sm uppercase tracking-wider transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                </svg>
                Send Bill via WhatsApp
              </button>
            </div>
            
          </div>
        </div>

      </div>

      {/* Product Selector Step Wizard Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">
                  Step {modalStep === 'category' ? '1 of 3' : modalStep === 'product' ? '2 of 3' : '3 of 3'}
                </span>
                <h3 className="text-base font-extrabold text-gray-900 mt-0.5">
                  {modalStep === 'category' && 'Select Category'}
                  {modalStep === 'product' && `Select ${modalSelectedCategory} Item`}
                  {modalStep === 'variant' && `Select Size / Variety`}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {modalStep === 'category' && (
                <div className="grid grid-cols-2 gap-4">
                  {categoriesList.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setModalSelectedCategory(cat);
                        setModalStep('product');
                      }}
                      className="flex flex-col items-center justify-center p-5 border border-gray-200 hover:border-primary hover:bg-red-50/10 rounded-2xl transition-all group active:scale-[0.98]"
                    >
                      <span className="w-12 h-12 bg-sky-50 border border-sky-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-sky-600 group-hover:text-white transition-colors text-sky-600">
                        {getCategoryIcon(cat)}
                      </span>
                      <span className="font-extrabold text-gray-800 text-xs md:text-sm">{cat}</span>
                    </button>
                  ))}
                </div>
              )}

              {modalStep === 'product' && (
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={modalSearchQuery}
                      onChange={(e) => setModalSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-full border border-sky-200 bg-white shadow-sm rounded-xl px-4 py-3.5 pl-11 text-sm font-semibold focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                    {dbProducts
                      .filter(p => p.category === modalSelectedCategory)
                      .filter(p => p.name.toLowerCase().includes(modalSearchQuery.toLowerCase()))
                      .length > 0 ? (
                      dbProducts
                        .filter(p => p.category === modalSelectedCategory)
                        .filter(p => p.name.toLowerCase().includes(modalSearchQuery.toLowerCase()))
                        .map(prod => (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => {
                              setModalSelectedProduct(prod);
                              setModalSelectedSizeName('');
                              setModalSelectedVariantId('');
                              setModalSelectedColor('');
                              setModalStep('variant');
                            }}
                            className="w-full text-left p-4 border border-gray-200 hover:border-primary hover:bg-red-50/10 rounded-xl transition-all flex justify-between items-center group font-bold text-gray-700 text-sm"
                          >
                            <span className="truncate">{prod.name}</span>
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-red-600 transition-transform group-hover:translate-x-0.5 duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7-7" />
                            </svg>
                          </button>
                        ))
                    ) : (
                      <p className="text-center py-8 text-sm font-semibold text-gray-400">No products found.</p>
                    )}
                  </div>
                </div>
              )}

              {modalStep === 'variant' && (
                <div className="space-y-4">
                  {modalSelectedProduct?.variants && modalSelectedProduct.variants.length > 0 ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">1. Select Size Category</label>
                        <select
                          value={modalSelectedSizeName}
                          onChange={(e) => {
                            setModalSelectedSizeName(e.target.value);
                            setModalSelectedVariantId(''); // reset dimension when size changes
                          }}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                        >
                          <option value="" disabled>-- Choose Size --</option>
                          {Array.from(new Set(modalSelectedProduct.variants.map(v => v.size_name))).map(size => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                      </div>

                      {modalSelectedSizeName && (
                        <div className="animate-fade-in">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">2. Select Dimensions</label>
                          <select
                            value={modalSelectedVariantId}
                            onChange={(e) => setModalSelectedVariantId(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                          >
                            <option value="" disabled>-- Choose Dimensions --</option>
                            {modalSelectedProduct.variants
                              .filter(v => v.size_name === modalSelectedSizeName)
                              .map(variant => (
                                <option key={variant.id} value={variant.id}>
                                  {variant.dimensions} - ₹{variant.price.toLocaleString('en-IN')}
                                </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {modalSelectedVariantId && modalSelectedProduct?.category.toLowerCase() === 'bedspreads' && (
                        <div className="animate-fade-in mt-4">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">3. Select Color (Optional)</label>
                          <select
                            value={modalSelectedColor}
                            onChange={(e) => setModalSelectedColor(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                          >
                            <option value="">-- Choose Color --</option>
                            <option value="Aqua Blue">Aqua Blue</option>
                            <option value="Tan">Tan</option>
                            <option value="Olive Green">Olive Green</option>
                            <option value="Blue">Blue</option>
                            <option value="Sky Blue">Sky Blue</option>
                            <option value="Lavender">Lavender</option>
                            <option value="Light Green">Light Green</option>
                            <option value="Yellow">Yellow</option>
                          </select>
                        </div>
                      )}

                      <div className="pt-2 border-t border-gray-100 mt-4">
                        <button
                          type="button"
                          disabled={!modalSelectedVariantId}
                          onClick={() => {
                            const variant = modalSelectedProduct.variants.find(v => v.id === modalSelectedVariantId);
                            if (variant && modalItemIndex !== null && modalSelectedProduct) {
                              selectProductVariant(modalItemIndex, modalSelectedProduct.name, variant, modalSelectedProduct.id, modalSelectedProduct.imageUrl, modalSelectedColor);
                            }
                            closeModal();
                          }}
                          className={`w-full font-extrabold py-3.5 px-4 rounded-xl transition-colors shadow-md text-sm ${
                            modalSelectedVariantId 
                              ? 'bg-sky-600 hover:bg-sky-700 text-white' 
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Confirm & Add to Invoice
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-center py-8 text-sm font-semibold text-gray-400">No sizes/varieties found.</p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
              {modalStep !== 'category' ? (
                <button
                  type="button"
                  onClick={handleModalBack}
                  className="p-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center"
                  title="Go Back"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs transition-colors"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
