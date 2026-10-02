import { Product, Size } from '@/types';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { products as fallbackProducts } from '@/lib/mock-data';

import { unstable_cache } from 'next/cache';

// Secure admin client bypassing RLS (fallback to anon key if service role is missing to prevent crash)
export const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

function generateRandomInvoiceId(year: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomStr = '';
  for (let i = 0; i < 7; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `INV-${year}-${randomStr}`;
}

function parseProductDescription(rawDesc: string | null) {
  if (!rawDesc) return { description: '', subCategory: '', colorVariants: [], extraSpecs: {} };
  const trimmed = rawDesc.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        description: parsed.description || '',
        subCategory: parsed.subCategory || '',
        colorVariants: parsed.colorVariants || [],
        extraSpecs: parsed.specifications || {}
      };
    } catch (e) {
      // Treat as raw text
    }
  }
  return { description: rawDesc, subCategory: '', colorVariants: [], extraSpecs: {} };
}

export const getProductsFromDB = unstable_cache(
  async (): Promise<Product[]> => {
    // We use supabaseAdmin instead of createClient to avoid Next.js cookie errors inside unstable_cache
    
    // We type cast select to any for simplicity here due to complex joins,
    // but in production you can generate deep types from database.types.ts
    try {
      const { data: mattresses, error } = await supabaseAdmin
        .from('mattresses')
        .select(`
          id, name, description, is_active,
          materials ( name ),
          product_images!product_images_mattress_id_fkey ( image_url, is_primary, sort_order ),
          variants!variants_mattress_id_fkey ( id, size_name, length, width, height, price, original_price, stock, sku )
        `)
        .eq('is_active', true);

      if (error || !mattresses || mattresses.length === 0) {
        return fallbackProducts;
      }

  const mattressesList = mattresses.map((m: any) => {
    // Sort images by sort_order
    const sortedImages = (m.product_images || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
    const images = sortedImages.map((img: any) => img.image_url);
    const primaryImageObj = sortedImages.find((img: any) => img.is_primary) || sortedImages[0];
    const thumbnail = primaryImageObj ? primaryImageObj.image_url : 'https://placehold.co/400x300?text=No+Image';
    const parsed = parseProductDescription(m.description);

    const sizes: Size[] = (m.variants || []).map((v: any) => ({
      id: v.id,
      label: v.size_name || 'Standard',
      dimensions: v.length > 0 ? `${v.length} × ${v.width}${v.height ? ` × ${v.height}` : ''} mm` : (v.size_name || 'Standard'),
      price: Number(v.price),
      inStock: v.stock > 0
    }));
    
    // Sort variants by price to find base price
    const sortedVariants = [...(m.variants || [])].sort((a, b) => a.price - b.price);
    
    const primaryImage = sortedImages.find((img: any) => img.is_primary) || sortedImages[0];
    
    const materialName = m.materials?.name || 'Foam';
    const basePrice = sortedVariants[0]?.price || 0; // The actual selling price
    let baseMrp = sortedVariants[0]?.original_price || undefined; // The actual MRP
    
    if (baseMrp && baseMrp <= basePrice) {
      baseMrp = undefined;
    }
    
    const discount = baseMrp ? Math.round(((baseMrp - basePrice) / baseMrp) * 100) : 0;

    return {
      id: m.id,
      slug: m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: m.name,
      description: parsed.description,
      shortDescription: parsed.description ? parsed.description.substring(0, 100) + '...' : '',
      category: materialName as any,
      subCategory: parsed.subCategory || 'Standard',
      price: basePrice,
      mrp: baseMrp,
      discount: discount > 0 ? discount : undefined,
      images: sortedImages.map((img: any) => img.image_url),
      thumbnail: primaryImage ? primaryImage.image_url : (sortedImages[0]?.image_url || 'https://placehold.co/400x300/0091FF/white?text=No+Image'),
      rating: 4.8, // Mocked rating
      reviewCount: 124, // Mocked reviews
      inStock: sortedVariants.some((v: any) => v.stock > 0),
      sizes: sortedVariants.map((v: any) => {
        const varPrice = Number(v.price);
        let varMrp = v.original_price ? Number(v.original_price) : undefined;
        
        if (varMrp && varMrp <= varPrice) {
          varMrp = undefined;
        }

        return {
          id: v.id,
          label: v.size_name || 'Standard',
          dimensions: v.length > 0 ? `${v.length} × ${v.width}${v.height ? ` × ${v.height}` : ''} mm` : (v.size_name || 'Standard'),
          price: varPrice,
          mrp: varMrp,
          inStock: v.stock > 0
        };
      }),
      materials: [materialName],
      features: [],
      specifications: {
        ...(m.warranty_years && m.warranty_years > 0 ? { 'Warranty': `${m.warranty_years} ${m.warranty_years === 1 ? 'Year' : 'Years'}` } : {}),
        ...parsed.extraSpecs
      }
    };
  });

    return mattressesList;
    } catch (err) {
      console.error('Error fetching products from Supabase:', err);
      return fallbackProducts;
    }
  },
  ['products-catalog'],
  { revalidate: 60, tags: ['products'] }
);

export const getCategoriesFromDB = unstable_cache(
  async (): Promise<{ id: string; name: string }[]> => {
    try {
      const { data, error } = await supabaseAdmin
        .from('materials')
        .select('id, name')
        .order('name', { ascending: true });

      if (error || !data) return [];
      return data;
    } catch (err) {
      console.error('Error fetching categories from DB:', err);
      return [];
    }
  },
  ['categories-list'],
  { revalidate: 60, tags: ['categories'] }
);

// Below are placeholders for other operations.
// These need to be adapted to Supabase as well.

export async function addProductToDB(product: Product) {
  throw new Error("Not implemented yet");
}

export async function deleteProductFromDB(productId: string) {
  throw new Error("Not implemented yet");
}

export async function updateProductInDB(updatedProduct: Product) {
  throw new Error("Not implemented yet");
}

export async function getOrdersFromDB() {
  try {
    const [ordersResponse, inquiriesResponse] = await Promise.all([
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
              mattress:mattresses!variants_mattress_id_fkey (
                name,
                materials ( name )
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
              mattress:mattresses!variants_mattress_id_fkey (
                name,
                materials ( name )
              )
            )
          )
        `)
        .order('created_at', { ascending: false })
    ]);
    
    const posOrders = (ordersResponse.data || []).map((o: any) => ({
      ...o,
      // Normalize inquiry_items from order_items so AnalyticsClient's `order.inquiry_items` access works
      inquiry_items: o.order_items || [],
    }));

    const webInquiries = (inquiriesResponse.data || []);

    // Deduplicate: orders table is source of truth; skip any inquiry whose ID already appears in orders
    const orderIds = new Set(posOrders.map((o: any) => o.id));
    const uniqueInquiries = webInquiries.filter((i: any) => !orderIds.has(i.id));

    const allOrders = [...posOrders, ...uniqueInquiries].sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    if (ordersResponse.error) {
      console.warn('Error fetching orders table from Supabase:', ordersResponse.error.message);
    }
    if (inquiriesResponse.error) {
      console.warn('Error fetching inquiries table from Supabase:', inquiriesResponse.error.message);
    }
    
    return allOrders;
  } catch (err) {
    console.warn('Unhandled exception in getOrdersFromDB:', err);
    return [];
  }
}

export async function addOrderToDB(order: any) {
  const getBaseId = (id: string) => id.split('_color_')[0];
  const isCatalog = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(getBaseId(id));

  const customItems = order.items.filter((item: any) => !isCatalog(item.productId));
  const catalogItems = order.items.filter((item: any) => isCatalog(item.productId));

  let finalNotes = order.notes || order.customerAddress || "";
  
  const colorItems = order.items.filter((item: any) => item.productId.includes('_color_'));
  if (colorItems.length > 0) {
    const colorNotes = colorItems
      .map((item: any) => `${item.productName || 'Bedspread'} - ${item.sizeLabel || 'Color Option'} (Qty: ${item.quantity})`)
      .join(", ");
    finalNotes = finalNotes ? `${finalNotes} | Selected Colors: ${colorNotes}` : `Selected Colors: ${colorNotes}`;
  }

  if (customItems.length > 0) {
    const customItemsText = customItems
      .map((item: any) => `${item.productName || item.name || 'Custom Product'} (Qty: ${item.quantity}) @ ₹${item.price || item.unit_price || 0}`)
      .join(", ");
    finalNotes = finalNotes ? `${finalNotes} | Custom Items: ${customItemsText}` : `Custom Items: ${customItemsText}`;
  }

  let generatedInvoiceId = '';
  try {
    const currentYear = new Date().getFullYear();
    generatedInvoiceId = generateRandomInvoiceId(currentYear);
    finalNotes = finalNotes ? `${finalNotes}\nINVOICE_ID: ${generatedInvoiceId}` : `INVOICE_ID: ${generatedInvoiceId}`;
  } catch (err) {
    console.error("Failed to generate INVOICE_ID", err);
  }

  const channelTag = order.channel || (order.isWhatsApp ? 'whatsapp' : 'pos');
  if (!finalNotes.includes('CHANNEL:')) {
    finalNotes = `${finalNotes} | CHANNEL: ${channelTag}`;
  }

  const { data: newOrder, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      customer_name: order.customerName || 'Walk-in Customer',
      customer_phone: order.customerPhone || '',
      notes: finalNotes,
      invoice_id: generatedInvoiceId || undefined,
      coupon_id: order.couponId || null,
      discount_amount: order.discountAmount || 0,
      total_amount: order.totalAmount,
      status: order.status || 'Completed',
      bill_type: order.customerAddress?.includes('RETAIL') ? 'retail' : 'wholesale'
    })
    .select()
    .single();

  if (orderError) throw new Error(orderError.message);

  if (catalogItems.length > 0) {
    const itemsToInsert = catalogItems.map((item: any) => ({
      order_id: newOrder.id,
      variant_id: getBaseId(item.productId),
      product_name: item.name || item.productName || null,
      quantity: item.quantity,
      unit_price: item.price
    }));

    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(itemsToInsert);
    if (itemsError) console.warn('Warning: Failed inserting order_items:', itemsError.message);
  }

  if (order.couponId) {
    try {
      const { data: coupon } = await supabaseAdmin.from('coupons').select('usage_count, usage_limit').eq('id', order.couponId).single();
      if (coupon) {
        const newUsageCount = (coupon.usage_count || 0) + 1;
        const updates: any = { usage_count: newUsageCount };
        if (coupon.usage_limit && newUsageCount >= coupon.usage_limit) {
          updates.is_active = false;
        }
        await supabaseAdmin.from('coupons').update(updates).eq('id', order.couponId);
      }
    } catch (err) {
      console.error('Failed to update coupon usage:', err);
    }
  }

  return newOrder;
}

export async function addInquiryToDB(order: any) {
  const getBaseId = (id: string) => id.split('_color_')[0];
  const isCatalog = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(getBaseId(id));

  const customItems = order.items.filter((item: any) => !isCatalog(item.productId));
  const catalogItems = order.items.filter((item: any) => isCatalog(item.productId));

  let finalNotes = order.notes || order.customerAddress || "";
  
  const colorItems = order.items.filter((item: any) => item.productId.includes('_color_'));
  if (colorItems.length > 0) {
    const colorNotes = colorItems
      .map((item: any) => `${item.productName || 'Bedspread'} - ${item.sizeLabel || 'Color Option'} (Qty: ${item.quantity})`)
      .join(", ");
    finalNotes = finalNotes ? `${finalNotes} | Selected Colors: ${colorNotes}` : `Selected Colors: ${colorNotes}`;
  }

  if (customItems.length > 0) {
    const customItemsText = customItems
      .map((item: any) => `${item.productName || item.name || 'Custom Product'} (Qty: ${item.quantity}) @ ₹${item.price || item.unit_price || 0}`)
      .join(", ");
    finalNotes = finalNotes ? `${finalNotes} | Custom Items: ${customItemsText}` : `Custom Items: ${customItemsText}`;
  }

  let generatedInvoiceId = '';
  try {
    const currentYear = new Date().getFullYear();
    generatedInvoiceId = generateRandomInvoiceId(currentYear);
    finalNotes = finalNotes ? `${finalNotes}\nINVOICE_ID: ${generatedInvoiceId}` : `INVOICE_ID: ${generatedInvoiceId}`;
  } catch (err) {
    console.error("Failed to generate INVOICE_ID", err);
  }

  const channelTag = order.channel || (order.isWhatsApp ? 'whatsapp' : 'storefront');
  if (!finalNotes.includes('CHANNEL:')) {
    finalNotes = `${finalNotes} | CHANNEL: ${channelTag}`;
  }

  const { data: inquiry, error: inquiryError } = await supabaseAdmin
    .from('inquiries')
    .insert({
      user_id: order.userId || null,
      customer_name: order.customerName || 'Valued Customer',
      customer_phone: order.customerPhone || '',
      notes: finalNotes,
      coupon_id: order.couponId || null,
      discount_amount: order.discountAmount || 0,
      total_amount: order.totalAmount,
      status: order.status || 'Pending'
    })
    .select()
    .single();

  if (inquiryError) throw new Error(inquiryError.message);

  if (catalogItems.length > 0) {
    const itemsToInsert = catalogItems.map((item: any) => ({
      inquiry_id: inquiry.id,
      variant_id: getBaseId(item.productId),
      product_name: item.productName || item.name || null,
      quantity: item.quantity,
      unit_price: item.price
    }));

    const { error: itemsError } = await supabaseAdmin.from('inquiry_items').insert(itemsToInsert);
    if (itemsError) throw new Error(itemsError.message);
  }

  if (order.couponId) {
    try {
      const { data: coupon } = await supabaseAdmin.from('coupons').select('usage_count, usage_limit').eq('id', order.couponId).single();
      if (coupon) {
        const newUsageCount = (coupon.usage_count || 0) + 1;
        const updates: any = { usage_count: newUsageCount };
        if (coupon.usage_limit && newUsageCount >= coupon.usage_limit) {
          updates.is_active = false;
        }
        await supabaseAdmin.from('coupons').update(updates).eq('id', order.couponId);
      }
    } catch (err) {
      console.error('Failed to update coupon usage:', err);
    }
  }

  return inquiry;
}

export async function updateOrderStatusInDB(orderId: string, status: string) {
  const { error } = await supabaseAdmin.from('orders').update({ status }).eq('id', orderId);
  if (error) throw new Error(error.message);
}

export async function updateInquiryStatusInDB(inquiryId: string, status: string) {
  const { error } = await supabaseAdmin.from('inquiries').update({ status }).eq('id', inquiryId);
  if (error) throw new Error(error.message);
}

export async function getAdminOverviewStats() {
  try {
    const [activeProductsCount, inquiriesCount, categoriesCount, pendingQuotesCount] = await Promise.all([
      supabaseAdmin.from('mattresses').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('inquiries').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('materials').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'Pending')
    ]);
    
    return {
      totalActiveProducts: activeProductsCount.count || 0,
      wholesaleInquiries: inquiriesCount.count || 0,
      categoryCount: categoriesCount.count || 0,
      pendingQuotes: pendingQuotesCount.count || 0
    };
  } catch (error) {
    console.error('Error fetching admin overview stats:', error);
    return {
      totalActiveProducts: 0,
      wholesaleInquiries: 0,
      categoryCount: 0,
      pendingQuotes: 0
    };
  }
}

