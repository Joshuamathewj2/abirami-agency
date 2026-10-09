'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { placeOrderAction } from '@/app/actions/orderActions';
import BillGeneratedView from '@/components/BillGeneratedView';
import { calculateTotals, InvoiceType, GstMode } from '@/lib/gst';

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

interface FlatCatalogItem {
  id: string;
  productId: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  sku?: string;
  imageUrl?: string;
}

export default function BillingClient() {
  // Customer Details State
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [phone, setPhone] = useState('');
  const [billDate, setBillDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');

  // GST & Totals Engine State
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('non-gst');
  const [gstMode, setGstMode] = useState<GstMode>('inclusive');
  const [gstRate, setGstRate] = useState<number>(18);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gpay'>('cash');
  const [amountReceived, setAmountReceived] = useState<number | ''>('');

  // Order Items State
  const [items, setItems] = useState<OrderItem[]>([{ name: '', price: 0, quantity: 1 }]);
  const [billingMode, setBillingMode] = useState<'offline' | 'online'>('offline');
  const [manualDiscountType, setManualDiscountType] = useState<'%' | 'flat'>('flat');
  const [manualDiscountValue, setManualDiscountValue] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  // Row-level Catalog Dropdown State
  const [activeCatalogRow, setActiveCatalogRow] = useState<number | null>(null);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState('All');
  const catalogSearchInputRef = useRef<HTMLInputElement>(null);

  // Quick "Add to Catalog" modal
  const [showAddToCatalogModal, setShowAddToCatalogModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatCategory, setNewCatCategory] = useState('');
  const [newCatPrice, setNewCatPrice] = useState<number>(0);
  const [newCatDesc, setNewCatDesc] = useState('');

  // Database products & coupons state
  const [dbProducts, setDbProducts] = useState<DBProduct[]>([]);
  const [dbCoupons, setDbCoupons] = useState<any[]>([]);
  const [couponInput, setCouponInput] = useState<string>('');
  const [selectedCoupon, setSelectedCoupon] = useState<string>('');
  const [couponFeedback, setCouponFeedback] = useState<string>('');
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
                dimensions: v.length > 0 ? `${v.length}" × ${v.width}"${v.height ? ` × ${v.height}"` : ''}` : (v.size_name || 'Standard'),
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

  // Autofocus catalog search input when dropdown opens
  useEffect(() => {
    if (activeCatalogRow !== null) {
      setTimeout(() => {
        catalogSearchInputRef.current?.focus();
      }, 50);
    }
  }, [activeCatalogRow]);

  // Flatten catalog items: each variant is listed as its own row (e.g. "Tiger One Piece WC – C8599 (S-230)")
  const flatCatalogItems = useMemo<FlatCatalogItem[]>(() => {
    const list: FlatCatalogItem[] = [];
    dbProducts.forEach(p => {
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach(v => {
          const hasVariantTag = v.size_name && v.size_name !== 'Standard';
          const hasDim = v.dimensions && v.dimensions !== 'Standard';
          let variantLabel = '';
          if (hasVariantTag && hasDim && v.size_name !== v.dimensions) {
            variantLabel = `${v.size_name} (${v.dimensions})`;
          } else if (hasVariantTag) {
            variantLabel = v.size_name;
          } else if (hasDim) {
            variantLabel = v.dimensions;
          }

          const displayName = variantLabel ? `${p.name} – ${variantLabel}` : p.name;
          const description = v.sku 
            ? `${p.name} (SKU: ${v.sku})` 
            : `${p.name} • ${p.category}`.toUpperCase();

          list.push({
            id: v.id,
            productId: p.id,
            name: p.name,
            displayName,
            description,
            category: p.category,
            price: v.price,
            stock: v.stock,
            sku: v.sku,
            imageUrl: p.imageUrl
          });
        });
      } else {
        list.push({
          id: p.id,
          productId: p.id,
          name: p.name,
          displayName: p.name,
          description: p.category.toUpperCase(),
          category: p.category,
          price: 0,
          stock: 50,
          imageUrl: p.imageUrl
        });
      }
    });
    return list;
  }, [dbProducts]);

  // Categories list for filter dropdown
  const categoriesList = useMemo(() => {
    const set = new Set(['All', ...dbCategories, ...flatCatalogItems.map(i => i.category)]);
    return Array.from(set).filter(Boolean);
  }, [dbCategories, flatCatalogItems]);

  // Filtered catalog items based on search query and category
  const filteredCatalogItems = useMemo(() => {
    let result = flatCatalogItems;
    if (catalogCategoryFilter && catalogCategoryFilter !== 'All') {
      result = result.filter(item => item.category.toLowerCase() === catalogCategoryFilter.toLowerCase());
    }
    if (catalogSearchQuery.trim()) {
      const q = catalogSearchQuery.toLowerCase().trim();
      result = result.filter(item =>
        item.displayName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.sku && item.sku.toLowerCase().includes(q))
      );
    }
    return result;
  }, [flatCatalogItems, catalogCategoryFilter, catalogSearchQuery]);

  // Row item actions
  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    const filtered = items.filter((_, i) => i !== index);
    setItems(filtered.length > 0 ? filtered : [{ name: '', price: 0, quantity: 1 }]);
    if (activeCatalogRow === index) {
      setActiveCatalogRow(null);
    } else if (activeCatalogRow !== null && activeCatalogRow > index) {
      setActiveCatalogRow(activeCatalogRow - 1);
    }
  };

  const addCustomItem = () => {
    setItems(prev => [...prev, { name: '', price: 0, quantity: 1 }]);
  };

  const clearOrder = () => {
    if (confirm("Are you sure you want to clear this entire bill?")) {
      setItems([{ name: '', price: 0, quantity: 1 }]);
      setCustomerName('Walk-in Customer');
      setPhone('');
      setCustomerAddress('');
      setCustomerGstin('');
      setSelectedCoupon('');
      setCouponInput('');
      setManualDiscountValue(0);
      setDeliveryFee(0);
      setAmountReceived('');
      setOrderFeedback(null);
      setActiveCatalogRow(null);
    }
  };

  const handleSelectCatalogItem = (rowIndex: number, catItem: FlatCatalogItem) => {
    const newItems = [...items];
    newItems[rowIndex] = {
      ...newItems[rowIndex],
      name: catItem.displayName,
      price: catItem.price,
      variantId: catItem.id,
      productId: catItem.productId,
      imageUrl: catItem.imageUrl,
    };
    setItems(newItems);
    setActiveCatalogRow(null);
    setCatalogSearchQuery('');
  };

  const handleDeleteCatalogItem = (e: React.MouseEvent, item: FlatCatalogItem) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${item.displayName}" from the catalog?`)) {
      setDbProducts(prev => prev.map(p => {
        if (p.id === item.productId) {
          return {
            ...p,
            variants: p.variants.filter(v => v.id !== item.id)
          };
        }
        return p;
      }).filter(p => p.variants.length > 0));
    }
  };

  const handleEditCatalogItem = (e: React.MouseEvent, item: FlatCatalogItem) => {
    e.stopPropagation();
    const newPriceStr = window.prompt(`Edit price for "${item.displayName}":`, String(item.price));
    if (newPriceStr !== null) {
      const newPrice = Number(newPriceStr);
      if (!isNaN(newPrice) && newPrice >= 0) {
        setDbProducts(prev => prev.map(p => {
          if (p.id === item.productId) {
            return {
              ...p,
              variants: p.variants.map(v => v.id === item.id ? { ...v, price: newPrice } : v)
            };
          }
          return p;
        }));
      }
    }
  };

  const handleCreateCatalogItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const cat = newCatCategory.trim() || 'General';
    const price = Math.max(0, Number(newCatPrice) || 0);
    const newProdId = 'custom-' + Date.now();
    const newVarId = 'var-' + Date.now();

    const created: DBProduct = {
      id: newProdId,
      name: newCatName.trim(),
      category: cat,
      variants: [{
        id: newVarId,
        size_name: newCatDesc.trim() || 'Standard',
        dimensions: newCatDesc.trim() || 'Standard',
        price: price,
        stock: 50,
      }]
    };

    setDbProducts(prev => [created, ...prev]);
    setShowAddToCatalogModal(false);
    setNewCatName('');
    setNewCatCategory('');
    setNewCatPrice(0);
    setNewCatDesc('');
  };

  // Raw Subtotal from line items
  const rawSubtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);

  // Apply Coupon Handler
  const handleApplyCoupon = () => {
    if (!couponInput.trim()) {
      setSelectedCoupon('');
      setCouponFeedback('');
      return;
    }
    const found = dbCoupons.find(c => c.code.toUpperCase() === couponInput.trim().toUpperCase());
    if (!found) {
      setCouponFeedback('Invalid coupon code');
      setSelectedCoupon('');
      return;
    }
    if (found.min_order_value && rawSubtotal < found.min_order_value) {
      setCouponFeedback(`Min order of ₹${found.min_order_value} required`);
      setSelectedCoupon('');
      return;
    }
    setSelectedCoupon(found.code);
    setCouponFeedback(`✓ Coupon ${found.code} applied!`);
  };

  // Coupon calculations
  const activeCouponObj = dbCoupons.find(c => c.code === selectedCoupon);
  let couponDiscount = 0;
  if (activeCouponObj) {
    if (!activeCouponObj.min_order_value || rawSubtotal >= activeCouponObj.min_order_value) {
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

  // Totals via unified calculation utility
  const totals = calculateTotals({
    subtotal: rawSubtotal,
    couponDiscount,
    manualDiscount,
    deliveryFee,
    invoiceType,
    gstMode,
    gstRate,
  });

  const isGst = invoiceType === 'gst';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const isPhoneValid = cleanPhone.length === 10;
  const numAmountReceived = typeof amountReceived === 'number' ? amountReceived : 0;
  const changeBalance = numAmountReceived > totals.grandTotal ? numAmountReceived - totals.grandTotal : 0;

  // Complete Sale & Invoice
  const generateWhatsAppBill = async () => {
    setOrderFeedback(null);
    const validItems = items.filter(it => it.name.trim() && it.price >= 0);

    if (validItems.length === 0) {
      setOrderFeedback({ type: 'error', message: "Please add at least one item to the invoice." });
      return;
    }

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
    billSummaryText += `${em.phone} Name: ${customerName || 'Walk-in Customer'}\n`;
    if (cleanPhone) billSummaryText += `${em.mobile} Mobile: ${cleanPhone}\n`;
    if (billDate) billSummaryText += `Date: ${billDate}\n`;
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
      amount_received: numAmountReceived > 0 ? numAmountReceived : totals.grandTotal,
      userId: null,
      status: 'Completed',
      paymentMethod: paymentMethod,
      order_date: billDate ? new Date(billDate).toISOString() : new Date().toISOString(),
      created_at: billDate ? new Date(billDate).toISOString() : new Date().toISOString(),
      notes: `${billSummaryText}\nINVOICE_TYPE: ${invoiceType}\nGST_MODE: ${gstMode}\nPAYMENT_METHOD: ${paymentMethod}\nDELIVERY_FEE: ${totals.delivery}\nBILL_DATE: ${billDate}`,
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
          amountReceived: numAmountReceived > 0 ? numAmountReceived : totals.grandTotal,
          balanceReturned: changeBalance,
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

  const handleNewSale = () => {
    setGeneratedBill(null);
    clearOrder();
  };

  if (generatedBill) {
    return (
      <div className="bg-slate-50 min-h-screen py-2">
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
          onSourceChange={(source) => setGeneratedBill((prev) => (prev ? { ...prev, billingMode: source } : null))}
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
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1560px] mx-auto pb-24 lg:pb-12 text-slate-900 font-sans">
      
      {/* 2-Column Responsive Layout (Image 3 style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── LEFT COLUMN: Customer Details + Order Items (Cols 7 on lg, 8 on xl) ── */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          
          {/* 1. Customer Details Card */}
          <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-base md:text-lg font-black text-slate-900">
              <span className="text-[#e6007e]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <h2>Customer Details</h2>
            </div>

            {/* Row 1: Name, Phone, Bill Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              {/* Customer Name */}
              <div>
                <label className="block text-[10px] md:text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                  CUSTOMER NAME
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-bold text-slate-900 focus:bg-white focus:border-[#e6007e] focus:ring-2 focus:ring-[#e6007e]/15 outline-none transition-all"
                  placeholder="Walk-in Customer"
                />
              </div>

              {/* Mobile Number (WhatsApp) */}
              <div>
                <label className="block text-[10px] md:text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>MOBILE NUMBER (WHATSAPP)</span>
                  {phone && (
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                      isPhoneValid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {isPhoneValid ? '✓ 10 DIGITS' : 'NEED 10'}
                    </span>
                  )}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-bold text-slate-900 focus:bg-white focus:border-[#e6007e] focus:ring-2 focus:ring-[#e6007e]/15 outline-none transition-all"
                  placeholder="Enter 10-digit number"
                />
              </div>

              {/* Bill Date (Custom / Past) */}
              <div>
                <label className="block text-[10px] md:text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span className="text-[#e6007e]">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <span>BILL DATE</span>
                  <span className="text-[9px] font-black text-[#e6007e] tracking-tight">CUSTOM / PAST</span>
                </label>
                <input
                  type="date"
                  value={billDate}
                  onChange={e => setBillDate(e.target.value)}
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-bold text-slate-900 focus:bg-white focus:border-[#e6007e] focus:ring-2 focus:ring-[#e6007e]/15 outline-none transition-all cursor-pointer"
                />
              </div>
            </div>

            {/* Row 2: Customer Address (Optional) */}
            <div>
              <label className="block text-[10px] md:text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                CUSTOMER ADDRESS (OPTIONAL)
              </label>
              <input
                type="text"
                value={customerAddress}
                onChange={e => setCustomerAddress(e.target.value)}
                className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-bold text-slate-900 focus:bg-white focus:border-[#e6007e] focus:ring-2 focus:ring-[#e6007e]/15 outline-none transition-all"
                placeholder="Enter full address"
              />
            </div>

            {/* Row 3: Customer GSTIN (Shown only when GST INVOICE is active) */}
            {isGst && (
              <div className="pt-1">
                <label className="block text-[10px] md:text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>CUSTOMER GSTIN (REQUIRED FOR TAX INVOICE)</span>
                  <span className="text-[10px] font-bold text-[#e6007e]">15 DIGITS</span>
                </label>
                <input
                  type="text"
                  value={customerGstin}
                  onChange={e => setCustomerGstin(e.target.value.toUpperCase())}
                  maxLength={15}
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-bold text-slate-900 font-mono uppercase focus:bg-white focus:border-[#e6007e] focus:ring-2 focus:ring-[#e6007e]/15 outline-none transition-all"
                  placeholder="e.g. 33AAAAA0000A1Z5"
                />
              </div>
            )}
          </div>

          {/* 2. Order Items Card */}
          <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 border border-slate-100 shadow-sm space-y-4">
            
            {/* Header: Title + Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-base md:text-lg font-black text-slate-900">
                <span className="text-[#e6007e]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </span>
                <h2>Order Items</h2>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                {/* CLEAR ORDER */}
                <button
                  type="button"
                  onClick={clearOrder}
                  className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>CLEAR ORDER</span>
                </button>

                {/* ADD TO CATALOG */}
                <button
                  type="button"
                  onClick={() => setShowAddToCatalogModal(true)}
                  className="px-3 py-2 bg-pink-50/60 hover:bg-pink-100/70 text-[#e6007e] border border-pink-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span>ADD TO CATALOG</span>
                </button>

                {/* + ADD CUSTOM ITEM */}
                <button
                  type="button"
                  onClick={addCustomItem}
                  className="px-3.5 py-2 bg-[#e6007e] hover:bg-[#d00072] text-white rounded-xl text-xs font-black flex items-center gap-1 transition-colors shadow-xs"
                >
                  <span>+ ADD CUSTOM ITEM</span>
                </button>
              </div>
            </div>

            {/* Table Header Columns */}
            <div className="hidden sm:grid grid-cols-12 gap-3 text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 pt-1">
              <div className="col-span-7">ITEM NAME / DESCRIPTION</div>
              <div className="col-span-2 text-right">PRICE (₹)</div>
              <div className="col-span-2 text-center">QTY</div>
              <div className="col-span-1 text-center">
                <svg className="w-3.5 h-3.5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" />
                </svg>
              </div>
            </div>

            {/* Item Rows */}
            <div className="space-y-3">
              {items.map((item, index) => {
                const isCatalogOpen = activeCatalogRow === index;
                return (
                  <div key={index} className="space-y-2">
                    <div className="p-3 sm:p-2 bg-slate-50/60 hover:bg-slate-50 rounded-2xl border border-slate-200/80 transition-all flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-3 items-center">
                      
                      {/* Name input + CATALOG button (Cols 7) */}
                      <div className="w-full sm:col-span-7 flex items-center gap-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={e => updateItem(index, 'name', e.target.value)}
                          placeholder="Type custom item name..."
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs md:text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-[#e6007e] focus:ring-2 focus:ring-[#e6007e]/15 outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (isCatalogOpen) {
                              setActiveCatalogRow(null);
                            } else {
                              setActiveCatalogRow(index);
                              setCatalogSearchQuery('');
                            }
                          }}
                          className={`shrink-0 px-2.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all border ${
                            isCatalogOpen
                              ? 'bg-[#e6007e] text-white border-[#e6007e] shadow-xs'
                              : 'bg-pink-50 hover:bg-pink-100 text-[#e6007e] border-pink-200'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h7" />
                          </svg>
                          <span>CATALOG</span>
                        </button>
                      </div>

                      {/* Mobile Row for Price, Qty and Delete */}
                      <div className="w-full sm:col-span-5 flex items-center justify-between sm:grid sm:grid-cols-5 gap-2">
                        {/* Price (Cols 2 on grid) */}
                        <div className="sm:col-span-2">
                          <input
                            type="number"
                            value={item.price === 0 ? '' : item.price}
                            onChange={e => updateItem(index, 'price', Math.max(0, Number(e.target.value) || 0))}
                            placeholder="0"
                            className="w-full text-right bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs md:text-sm font-black text-slate-900 focus:border-[#e6007e] outline-none"
                            min="0"
                          />
                        </div>

                        {/* Qty (- 1 +) (Cols 2 on grid) */}
                        <div className="sm:col-span-2 flex items-center justify-center bg-white border border-slate-200 rounded-xl overflow-hidden h-[38px]">
                          <button
                            type="button"
                            onClick={() => updateItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                            className="w-7 h-full text-slate-500 hover:text-slate-900 font-bold hover:bg-slate-100 transition-colors"
                          >
                            –
                          </button>
                          <span className="flex-1 text-center font-black text-xs md:text-sm text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateItem(index, 'quantity', item.quantity + 1)}
                            className="w-7 h-full text-slate-500 hover:text-slate-900 font-bold hover:bg-slate-100 transition-colors"
                          >
                            +
                          </button>
                        </div>

                        {/* Delete Trash Icon (Cols 1 on grid) */}
                        <div className="sm:col-span-1 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Remove line item"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ── INLINE CATALOG DROPDOWN (Renders directly under the active row) ── */}
                    {isCatalogOpen && (
                      <div className="bg-white rounded-2xl border-2 border-[#e6007e]/30 shadow-xl p-3 md:p-4 space-y-3 animate-fade-in relative z-20">
                        {/* Search & Category Header */}
                        <div className="space-y-2">
                          <div className="relative">
                            <input
                              ref={catalogSearchInputRef}
                              type="text"
                              value={catalogSearchQuery}
                              onChange={e => setCatalogSearchQuery(e.target.value)}
                              placeholder="Search catalog items..."
                              className="w-full bg-slate-50 border border-slate-200 focus:border-[#e6007e] rounded-xl pl-9 pr-9 py-2 text-xs md:text-sm font-bold text-slate-900 outline-none"
                            />
                            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <button
                              type="button"
                              onClick={() => {
                                if (catalogSearchQuery) {
                                  setCatalogSearchQuery('');
                                } else {
                                  setActiveCatalogRow(null);
                                }
                              }}
                              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 p-0.5"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Category Filter Select */}
                          <div className="flex items-center gap-2">
                            <select
                              value={catalogCategoryFilter}
                              onChange={e => setCatalogCategoryFilter(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-3 py-2 outline-none cursor-pointer focus:border-[#e6007e]"
                            >
                              {categoriesList.map(cat => (
                                <option key={cat} value={cat}>
                                  {cat === 'All' ? 'All categories' : cat}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Flat scrollable list of catalog items */}
                        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-100">
                          {isLoading ? (
                            <div className="p-4 text-center text-xs font-bold text-slate-400">Loading catalog items...</div>
                          ) : filteredCatalogItems.length === 0 ? (
                            <div className="p-6 text-center text-xs font-bold text-slate-400">
                              No items match "{catalogSearchQuery}". Click "+ Add Custom Item" to bill a custom product.
                            </div>
                          ) : (
                            filteredCatalogItems.map(catItem => (
                              <div
                                key={catItem.id}
                                onClick={() => handleSelectCatalogItem(index, catItem)}
                                className="p-2.5 hover:bg-pink-50/50 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs md:text-sm font-bold text-slate-900 group-hover:text-[#e6007e] transition-colors leading-snug">
                                    {catItem.displayName}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider line-clamp-1 mt-0.5">
                                    {catItem.description}
                                  </p>
                                  <p className="text-xs md:text-sm font-black text-[#e6007e] mt-1">
                                    ₹{catItem.price.toLocaleString('en-IN')}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {/* Edit Pencil Icon */}
                                  <button
                                    type="button"
                                    onClick={e => handleEditCatalogItem(e, catItem)}
                                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                                    title="Edit price"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>

                                  {/* Delete Trash Icon */}
                                  <button
                                    type="button"
                                    onClick={e => handleDeleteCatalogItem(e, catItem)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Delete from catalog"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* ── RIGHT COLUMN: Current Order Summary (Cols 5 on lg, 4 on xl) ── */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 border border-slate-100 shadow-sm space-y-4 lg:sticky lg:top-4">
            
            {/* Header: Current Order + OFFLINE (POS) Pill */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-base md:text-lg font-black text-slate-900">
                <span className="text-[#e6007e]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </span>
                <h2>Current Order</h2>
              </div>
              <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-full text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                OFFLINE (POS)
              </span>
            </div>

            {/* Order Metadata Box */}
            <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-slate-500 font-bold text-[11px]">
                <span className="uppercase tracking-wider">SOURCE</span>
                <span className="text-slate-900 uppercase font-black px-2 py-0.5 bg-white rounded-md border border-slate-200">
                  {billingMode.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500 font-bold text-[11px]">
                <span className="uppercase tracking-wider">CUSTOMER</span>
                <span className="text-slate-900 font-black truncate max-w-[160px]">
                  {customerName || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500 font-bold text-[11px]">
                <span className="uppercase tracking-wider">PHONE</span>
                <span className="text-slate-900 font-black">
                  {phone || '-'}
                </span>
              </div>

              {/* Items Summary */}
              <div className="pt-2 border-t border-slate-200/60">
                {items.filter(i => i.name.trim()).length === 0 ? (
                  <p className="text-center text-slate-400 italic text-[11px] py-1">
                    No items added yet
                  </p>
                ) : (
                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                    {items.filter(i => i.name.trim()).map((it, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] text-slate-700 font-semibold">
                        <span className="truncate max-w-[170px]">{it.name} (x{it.quantity})</span>
                        <span className="font-black text-slate-900">₹{(it.price * it.quantity).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Manual Discount */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                MANUAL DISCOUNT
              </label>
              <div className="flex items-center gap-1.5">
                <select
                  value={manualDiscountType}
                  onChange={e => setManualDiscountType(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-black text-slate-800 outline-none"
                >
                  <option value="flat">₹</option>
                  <option value="%">%</option>
                </select>
                <input
                  type="number"
                  value={manualDiscountValue === 0 ? '' : manualDiscountValue}
                  onChange={e => setManualDiscountValue(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#e6007e]"
                  min="0"
                />
              </div>
            </div>

            {/* Coupon Discount */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                COUPON DISCOUNT
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="E.G. WELCOME10"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900 uppercase outline-none focus:bg-white focus:border-[#e6007e]"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-3.5 py-2 bg-[#e6007e] hover:bg-[#d00072] text-white text-xs font-black rounded-xl transition-colors shrink-0 shadow-2xs"
                >
                  APPLY
                </button>
              </div>
              {couponFeedback && (
                <p className={`text-[10px] font-bold mt-1 ${selectedCoupon ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {couponFeedback}
                </p>
              )}
            </div>

            {/* Subtotal & Delivery lines */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
              <div className="flex justify-between items-center text-slate-600 font-semibold">
                <span>Subtotal ({items.filter(i => i.name.trim()).length} items)</span>
                <span className="font-black text-slate-900">₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {totals.totalDiscount > 0 && (
                <div className="flex justify-between items-center text-rose-600 font-semibold">
                  <span>Discount</span>
                  <span className="font-black">-₹{totals.totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-slate-600 font-semibold">
                <span>Delivery</span>
                <input
                  type="number"
                  value={deliveryFee === 0 ? '' : deliveryFee}
                  onChange={e => setDeliveryFee(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="0"
                  className="w-20 text-right bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 outline-none"
                  min="0"
                />
              </div>
            </div>

            {/* NON-GST BILL / GST INVOICE Toggle */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl gap-1">
                <button
                  type="button"
                  onClick={() => setInvoiceType('non-gst')}
                  className={`py-2 text-[11px] font-black uppercase rounded-xl transition-all ${
                    !isGst
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  NON-GST BILL
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceType('gst')}
                  className={`py-2 text-[11px] font-black uppercase rounded-xl transition-all ${
                    isGst
                      ? 'bg-[#e6007e] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  GST INVOICE
                </button>
              </div>

              {/* GST controls & breakdown */}
              {isGst && (
                <div className="bg-pink-50/50 border border-pink-100 rounded-2xl p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Calculation:</span>
                    <div className="flex items-center bg-white border border-pink-200 rounded-lg p-0.5 text-[10px] font-black">
                      <button
                        type="button"
                        onClick={() => setGstMode('inclusive')}
                        className={`px-2 py-0.5 rounded-md ${gstMode === 'inclusive' ? 'bg-[#e6007e] text-white' : 'text-slate-600'}`}
                      >
                        INCLUSIVE
                      </button>
                      <button
                        type="button"
                        onClick={() => setGstMode('exclusive')}
                        className={`px-2 py-0.5 rounded-md ${gstMode === 'exclusive' ? 'bg-[#e6007e] text-white' : 'text-slate-600'}`}
                      >
                        EXCLUSIVE (+GST)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">GST Rate (%):</span>
                    <input
                      type="number"
                      value={gstRate}
                      onChange={e => setGstRate(Math.max(0, Number(e.target.value) || 0))}
                      className="w-14 text-right bg-white border border-pink-200 rounded-lg px-2 py-0.5 font-black text-xs text-slate-900 outline-none"
                    />
                  </div>

                  <div className="pt-2 border-t border-pink-200/60 space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-600 font-semibold">
                      <span>Taxable Value:</span>
                      <span className="font-bold text-slate-900">₹{totals.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>CGST ({(gstRate / 2).toFixed(1)}%):</span>
                      <span>₹{totals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>SGST ({(gstRate / 2).toFixed(1)}%):</span>
                      <span>₹{totals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[#e6007e] font-black pt-1 border-t border-pink-200/40">
                      <span>Total GST (+{gstRate}%):</span>
                      <span>₹{totals.gstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Option (CASH / GPAY only) */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                FINANCIAL OPTION
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'cash', label: 'CASH' },
                  { id: 'gpay', label: 'GPAY' },
                ].map(opt => {
                  const isSelected = paymentMethod === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPaymentMethod(opt.id as any)}
                      className={`py-2.5 rounded-xl text-xs font-black uppercase text-center transition-all ${
                        isSelected
                          ? 'bg-[#e6007e] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GRAND TOTAL */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-wider">
                GRAND TOTAL
              </span>
              <span className="text-2xl md:text-3xl font-black text-[#e6007e] tracking-tight">
                ₹{totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Cash Payment: Amount Received & Change Balance */}
            {paymentMethod === 'cash' && (
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                    CASH PAYMENT<br />
                    <span className="text-slate-400 font-normal">Amount Received (₹)</span>
                  </span>
                  <input
                    type="number"
                    value={amountReceived === '' ? '' : amountReceived}
                    onChange={e => setAmountReceived(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={String(totals.grandTotal)}
                    className="w-28 text-right bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-black text-xs text-slate-900 outline-none focus:border-[#e6007e]"
                    min="0"
                  />
                </div>
                {changeBalance > 0 && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-[11px] font-bold text-emerald-700">
                    <span>Change / Return:</span>
                    <span className="font-black">₹{changeBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>
            )}

            {/* Feedback / Error Message */}
            {orderFeedback && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold leading-relaxed border ${
                  orderFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {orderFeedback.message}
              </div>
            )}

            {/* Complete Sale & Invoice Button (Desktop) */}
            <button
              type="button"
              onClick={generateWhatsAppBill}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-2xl font-black text-sm tracking-wide uppercase transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.149.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.768-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z" />
              </svg>
              <span>COMPLETE SALE & INVOICE</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── MOBILE STICKY BOTTOM BUTTON (< lg) ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md p-3 border-t border-slate-200 shadow-2xl">
        <div className="flex items-center justify-between gap-3 mb-2 px-1">
          <span className="text-xs font-black text-slate-600 uppercase">Grand Total:</span>
          <span className="text-lg font-black text-[#e6007e]">
            ₹{totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <button
          type="button"
          onClick={generateWhatsAppBill}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.149.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.768-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z" />
          </svg>
          <span>COMPLETE SALE & INVOICE</span>
        </button>
      </div>

      {/* ── ADD TO CATALOG MODAL ── */}
      {showAddToCatalogModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span className="text-[#e6007e]">📦</span> Add Item to Catalog
              </h3>
              <button
                type="button"
                onClick={() => setShowAddToCatalogModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCatalogItem} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="e.g. Parryware Glacier Floor WC"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#e6007e]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={newCatCategory}
                    onChange={e => setNewCatCategory(e.target.value)}
                    placeholder="e.g. Water Closets"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#e6007e]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={newCatPrice === 0 ? '' : newCatPrice}
                    onChange={e => setNewCatPrice(Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black outline-none focus:border-[#e6007e]"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                  Description / Variant / Dimensions
                </label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  placeholder="e.g. S-Trap (220mm) White Ceramic"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#e6007e]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddToCatalogModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#e6007e] hover:bg-[#d00072] text-white text-xs font-black rounded-xl transition-colors shadow-xs"
                >
                  Save to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
