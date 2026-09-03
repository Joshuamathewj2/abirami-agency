'use server';

import { addOrderToDB, getOrdersFromDB, updateOrderStatusInDB, addInquiryToDB, updateInquiryStatusInDB } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function placeOrderAction(orderData: any) {
  try {
    // POS bills → orders table only (no dual-write; avoids duplicate rows in WhatsApp Center)
    const newOrder = await addOrderToDB(orderData);

    revalidatePath('/admin/inquiries');
    revalidatePath('/admin/orders');
    revalidatePath('/admin/analytics');
    revalidatePath('/admin/pos-analytics');
    revalidatePath('/admin/whatsapp');
    revalidatePath('/admin/billing');
    revalidatePath('/admin/dashboard');
    
    return { success: true, invoiceId: newOrder?.invoice_id || newOrder?.id };
  } catch (error: any) {
    console.error('Failed to place order:', error);
    return { success: false, error: error?.message || 'Failed to place order' };
  }
}

export async function placeInquiryAction(orderData: any) {
  try {
    // Fallback: check server-side user session if userId wasn't passed by client
    if (!orderData?.userId) {
      try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          orderData = { ...orderData, userId: user.id };
        }
      } catch (authErr) {
        console.warn('Could not resolve server user session in placeInquiryAction:', authErr);
      }
    }

    // Website/WhatsApp orders → inquiries table only (no dual-write; avoids duplicate rows)
    const inquiry = await addInquiryToDB(orderData);

    revalidatePath('/admin/inquiries');
    revalidatePath('/admin/orders');
    revalidatePath('/admin/analytics');
    revalidatePath('/admin/pos-analytics');
    revalidatePath('/admin/whatsapp');
    revalidatePath('/admin/billing');
    revalidatePath('/admin/dashboard');

    // Generate the ORD ID by counting previous inquiries
    const { supabaseAdmin } = await import('@/lib/db');
    let ordId = 'PENDING';
    if (inquiry && inquiry.created_at) {
      const { count } = await supabaseAdmin
        .from('inquiries')
        .select('id', { count: 'exact', head: true })
        .lt('created_at', inquiry.created_at);
      
      const idx = count || 0;
      const year = new Date(inquiry.created_at).getFullYear();
      const numStr = String(idx + 1).padStart(4, '0');
      ordId = `ORD-${year}-${numStr}`;
    }

    return { success: true, id: inquiry.id, ordId, createdAt: inquiry.created_at };
  } catch (error: any) {
    const errorMsg = error?.message || error?.toString() || 'Unknown error';
    console.error('[placeInquiryAction] Failed to place inquiry in DB:', errorMsg);
    return { 
      success: false, 
      error: `Database save failed: ${errorMsg}. Your WhatsApp order will still be sent.`,
      allowWhatsAppFallback: true
    };
  }
}


export async function getAllInquiriesAction() {
  try {
    const { supabaseAdmin } = await import('@/lib/db');
    
    const [ordersRes, inquiriesRes] = await Promise.all([
      supabaseAdmin
        .from('orders')
        .select(`
          *,
          coupon:coupons(code),
          order_items (
            id,
            product_name,
            quantity,
            unit_price,
            variant:variants (
              size_name,
              length,
              width,
              height,
              mattress:mattresses!variants_mattress_id_fkey (
                name,
                materials ( name ),
                product_images!product_images_mattress_id_fkey(image_url, sort_order)
              )
            )
          )
        `)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('inquiries')
        .select(`
          *,
          coupon:coupons(code),
          inquiry_items (
            id,
            product_name,
            quantity,
            unit_price,
            variant:variants (
              size_name,
              length,
              width,
              height,
              mattress:mattresses!variants_mattress_id_fkey (
                name,
                materials ( name ),
                product_images!product_images_mattress_id_fkey(image_url, sort_order)
              )
            )
          )
        `)
        .order('created_at', { ascending: false }),
    ]);

    // Normalize orders → map order_items into inquiry_items shape for WhatsApp Center rendering
    const orders = (ordersRes.data || []).map((ord: any) => ({
      id: ord.id,
      customer_name: ord.customer_name || 'Walk-in Customer',
      customer_phone: ord.customer_phone || '',
      notes: ord.notes || `BILL TYPE: ${(ord.bill_type || 'RETAIL').toUpperCase()}`,
      status: ord.status || 'Completed',
      discount_amount: ord.discount_amount || 0,
      coupon_id: ord.coupon_id || null,
      coupon: ord.coupon || (ord.coupon_code ? { code: ord.coupon_code } : null),
      total_amount: ord.total_amount || 0,
      created_at: ord.created_at,
      invoice_id: ord.invoice_id || `INV-${new Date(ord.created_at || Date.now()).getFullYear()}-${ord.id.substring(0, 7).toUpperCase()}`,
      // Map order_items into inquiry_items structure so WhatsApp Center renders items correctly
      inquiry_items: (ord.order_items || []).map((item: any) => ({
        id: item.id,
        product_name: item.product_name || item.variant?.mattress?.name || 'Sanitaryware Product',
        quantity: item.quantity,
        unit_price: item.unit_price,
        variant: item.variant || null,
      })),
    }));

    const inquiries = (inquiriesRes.data || []);

    // Deduplicate: skip inquiries whose ID already exists in orders (from dual-write)
    const orderIds = new Set(orders.map((o: any) => o.id));
    const uniqueInquiries = inquiries.filter((i: any) => !orderIds.has(i.id));

    const combined = [...orders, ...uniqueInquiries].sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    console.log('[SERVER ACTION getAllInquiriesAction] serviceKeyPresent:', !!process.env.SUPABASE_SERVICE_ROLE_KEY, 'ordersError:', ordersRes.error?.message, 'inquiriesError:', inquiriesRes.error?.message);
    console.log('[SERVER ACTION getAllInquiriesAction] combinedCount:', combined.length, 'ordersCount:', orders.length, 'inquiriesCount:', uniqueInquiries.length);

    return { success: true, data: combined };
  } catch (error: any) {
    console.warn('Failed to fetch inquiries:', error?.message || JSON.stringify(error));
    return { success: false, error: 'Failed to fetch inquiries', data: [] };
  }
}

export async function updateOrderStatusAction(orderId: string, status: string) {
  try {
    const { supabaseAdmin } = await import('@/lib/db');
    await Promise.allSettled([
      supabaseAdmin.from('orders').update({ status }).eq('id', orderId),
      supabaseAdmin.from('inquiries').update({ status }).eq('id', orderId)
    ]);
    
    revalidatePath('/admin/inquiries');
    revalidatePath('/admin/orders');
    revalidatePath('/admin/analytics');
    revalidatePath('/admin/whatsapp');
    revalidatePath('/admin/billing');
    return { success: true };
  } catch (error) {
    console.error('Failed to update order:', error);
    return { success: false, error: 'Failed to update order' };
  }
}

export async function updateInquiryStatusAction(inquiryId: string, status: string) {
  try {
    const { supabaseAdmin } = await import('@/lib/db');
    await Promise.allSettled([
      supabaseAdmin.from('inquiries').update({ status }).eq('id', inquiryId),
      supabaseAdmin.from('orders').update({ status }).eq('id', inquiryId)
    ]);

    revalidatePath('/admin/inquiries');
    revalidatePath('/admin/orders');
    revalidatePath('/admin/analytics');
    revalidatePath('/admin/whatsapp');
    revalidatePath('/admin/billing');
    return { success: true };
  } catch (error) {
    console.error('Failed to update inquiry:', error);
    return { success: false, error: 'Failed to update inquiry' };
  }
}

export async function getUserOrdersAction(userId: string) {
  try {
    const { supabaseAdmin } = await import('@/lib/db');

    console.log('[SERVER ACTION getUserOrdersAction] fetching orders for userId:', userId);

    const { data: inquiries, error } = await supabaseAdmin
      .from('inquiries')
      .select(`
        id,
        created_at,
        customer_name,
        total_amount,
        status,
        inquiry_items (
          id,
          quantity,
          unit_price,
          variant:variants (
            size_name,
            length,
            width,
            height,
            mattress:mattresses!variants_mattress_id_fkey (
              name
            )
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error in getUserOrdersAction:', error);
      throw error;
    }

    if (!inquiries || inquiries.length === 0) {
      return [];
    }

    // For each user inquiry, run a parallel query to count preceding inquiries to generate the ORD ID
    const resolvedInquiries = await Promise.all(inquiries.map(async (inq: any) => {
      let ordId = `ORD-${new Date(inq.created_at || new Date()).getFullYear()}-0000`;
      
      if (inq.created_at) {
        const { count } = await supabaseAdmin
          .from('inquiries')
          .select('id', { count: 'exact', head: true })
          .lt('created_at', inq.created_at);
          
        const idx = count || 0;
        const year = new Date(inq.created_at).getFullYear();
        const numStr = String(idx + 1).padStart(4, '0');
        ordId = `ORD-${year}-${numStr}`;
      }

      return {
        id: inq.id,
        ordId,
        customerName: inq.customer_name,
        createdAt: inq.created_at,
        totalAmount: inq.total_amount,
        status: inq.status,
        items: (inq.inquiry_items || []).map((item: any) => ({
          productName: item.variant?.mattress?.name || 'Unknown Product',
          sizeLabel: item.variant?.size_name || 'Standard',
          dimensions: `${item.variant?.length || 0}" x ${item.variant?.width || 0}"${item.variant?.height ? ` x ${item.variant.height}"` : ''}`,
          quantity: item.quantity,
          price: item.unit_price
        }))
      };
    }));

    return resolvedInquiries;
  } catch (error) {
    console.error('Failed to fetch user orders for userId:', userId, 'Error:', error);
    return [];
  }
}

export async function toggleUserRoleAction(userId: string, newRole: string) {
  try {
    const { supabaseAdmin } = await import('@/lib/db');
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) throw error;

    // Also sync the role to auth user_metadata so middleware doesn't have to query profiles
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authUser?.user) {
      const currentMetadata = authUser.user.user_metadata || {};
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { ...currentMetadata, role: newRole }
      });
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Failed to update user role:', error);
    return { success: false, error: 'Failed to update user role' };
  }
}

export async function getInvoiceAction(id: string) {
  try {
    const { supabaseAdmin } = await import('@/lib/db');
    const isInvoiceId = id.toUpperCase().startsWith('INV-');

    const selectOrders = `
      *,
      order_items (
        *,
        variants (
          size_name,
          length,
          width,
          height,
          sku,
          mattresses!variants_mattress_id_fkey ( name )
        )
      )
    `;
    const selectInquiries = `
      *,
      inquiry_items (
        *,
        variants (
          size_name,
          length,
          width,
          height,
          sku,
          mattresses!variants_mattress_id_fkey ( name )
        )
      )
    `;

    // Search orders table
    let query = supabaseAdmin.from('orders').select(selectOrders);
    if (isInvoiceId) {
      query = query.eq('invoice_id', id.toUpperCase());
    } else {
      query = query.eq('id', id);
    }
    const { data: orderData } = await query.maybeSingle();
    if (orderData) return { success: true, data: orderData };

    // Search inquiries table
    let inqQuery = supabaseAdmin.from('inquiries').select(selectInquiries);
    if (isInvoiceId) {
      inqQuery = inqQuery.ilike('notes', `%INVOICE_ID: ${id.toUpperCase()}%`);
    } else {
      inqQuery = inqQuery.eq('id', id);
    }
    const { data: inqData } = await inqQuery.maybeSingle();
    if (inqData) {
      // Normalize inquiry_items → order_items for consistent rendering
      const normalized = { ...inqData, order_items: (inqData as any).inquiry_items || [] };
      delete (normalized as any).inquiry_items;
      return { success: true, data: normalized };
    }

    return { success: false, error: 'Invoice not found' };
  } catch (error) {
    console.error('Failed to fetch invoice:', error);
    return { success: false, error: 'Failed to fetch invoice' };
  }
}
