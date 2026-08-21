import { getOrdersFromDB } from '@/lib/db';
import AnalyticsClient from './AnalyticsClient';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  try {
    const orders = await getOrdersFromDB();
    return <AnalyticsClient initialInquiries={orders || []} />;
  } catch (error) {
    console.warn('Failed to load analytics data:', error instanceof Error ? error.message : JSON.stringify(error));
    return <AnalyticsClient initialInquiries={[]} />;
  }
}
