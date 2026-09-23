'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import BillGeneratedView, { BillItem } from '@/components/BillGeneratedView';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId') || searchParams.get('id') || 'INV-2026-PENDING';

  const [loading, setLoading] = useState(true);
  const [billData, setBillData] = useState<{
    invoiceId: string;
    grandTotal: number;
    subtotal?: number;
    discountAmount?: number;
    amountReceived: number;
    balanceReturned: number;
    items: BillItem[];
    whatsappUrl: string;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    paymentMode?: string;
  } | null>(null);

  useEffect(() => {
    async function fetchOrderDetails() {
      setLoading(true);
      try {
        const cleanId = orderId.replace(/^#/, '');
        // Search in orders or inquiries
        const { data: order } = await supabase
          .from('inquiries')
          .select('*, inquiry_items(*)')
          .or(`id.eq.${cleanId},invoice_id.eq.${cleanId}`)
          .maybeSingle();

        if (order) {
          const items: BillItem[] = (order.inquiry_items || []).map((it: any) => ({
            name: it.product_name || 'Product Item',
            quantity: it.quantity || 1,
            unit: 'piece',
            price: it.unit_price || 0,
            total: (it.unit_price || 0) * (it.quantity || 1),
          }));

          const orderAny = order as any;
          const invoiceTag = orderAny?.invoice_id || order.id || cleanId;
          const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '918610710434';
          const msg = `Abirami Agency - Order #${invoiceTag}\nThank you for shopping with us! Total: ₹${order.total_amount}`;
          const whatsappUrl = `https://api.whatsapp.com/send/?phone=${phoneNumber}&text=${encodeURIComponent(msg)}`;

          setBillData({
            invoiceId: invoiceTag,
            grandTotal: order.total_amount || 0,
            subtotal: order.total_amount || 0,
            discountAmount: order.discount_amount || 0,
            amountReceived: order.total_amount || 0,
            balanceReturned: 0,
            items,
            whatsappUrl,
            customerName: order.customer_name,
            customerPhone: order.customer_phone,
            customerAddress: order.notes || orderAny.customer_address || '',
            paymentMode: 'Online / WhatsApp',
          });
        } else {
          // Fallback view with orderId
          const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '918610710434';
          const whatsappUrl = `https://api.whatsapp.com/send/?phone=${phoneNumber}&text=${encodeURIComponent(`Hello Abirami Agency, I placed order #${cleanId}`)}`;
          setBillData({
            invoiceId: cleanId,
            grandTotal: 0,
            subtotal: 0,
            discountAmount: 0,
            amountReceived: 0,
            balanceReturned: 0,
            items: [],
            whatsappUrl,
          });
        }
      } catch (err) {
        console.error('Failed to load order success data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrderDetails();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!billData) {
    return (
      <div className="container-main py-16 text-center">
        <h2 className="text-xl font-bold text-gray-800">Order confirmed</h2>
        <p className="text-sm text-gray-500 mt-2">Thank you for shopping with Abirami Agency.</p>
        <button
          onClick={() => router.push('/products')}
          className="mt-6 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-semibold text-sm"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <BillGeneratedView
        invoiceId={billData.invoiceId}
        grandTotal={billData.grandTotal}
        subtotal={billData.subtotal}
        discountAmount={billData.discountAmount}
        deliveryFee={0}
        amountReceived={billData.amountReceived}
        balanceReturned={billData.balanceReturned}
        items={billData.items}
        whatsappUrl={billData.whatsappUrl}
        onNewSale={() => router.push('/products')}
        brandTitle="Abirami Agency"
        billingMode="online"
        customerName={billData.customerName}
        customerPhone={billData.customerPhone}
        customerAddress={billData.customerAddress}
        paymentMode={billData.paymentMode}
      />
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
