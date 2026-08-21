import { createClient } from '@/lib/supabase/server';
import CouponsClient from './CouponsClient';

export const dynamic = 'force-dynamic';

export default async function CouponsPage() {
  const supabase = await createClient();
  const { data: coupons } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  return <CouponsClient initialCoupons={coupons || []} />;
}
