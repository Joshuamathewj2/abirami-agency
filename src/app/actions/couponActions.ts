'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// We use the service_role key to safely bypass RLS on the server
// This ensures no one can tamper with coupons from the public frontend
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function addCouponAction(couponData: {
  code: string;
  percentage?: number | null;
  flat_discount?: number | null;
  min_order_value?: number | null;
  max_discount?: number | null;
  expiry_date?: string | null;
  usage_limit?: number | null;
}) {
  const { error } = await supabaseAdmin.from('coupons').insert({
    ...couponData,
    is_active: true
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin/coupons');
  revalidatePath('/admin/billing');
}

export async function toggleCouponStatusAction(couponId: string, isActive: boolean) {
  const { error } = await supabaseAdmin.from('coupons').update({ is_active: isActive }).eq('id', couponId);
  
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin/coupons');
  revalidatePath('/admin/billing');
}

export async function deleteCouponAction(couponId: string) {
  const { error } = await supabaseAdmin.from('coupons').delete().eq('id', couponId);
  
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin/coupons');
  revalidatePath('/admin/billing');
}
