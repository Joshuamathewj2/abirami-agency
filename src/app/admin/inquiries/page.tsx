import { getAllInquiriesAction } from '@/app/actions/orderActions';
import InquiriesClient from './InquiriesClient';

export const dynamic = 'force-dynamic';

export default async function InquiriesPage() {
  const result = await getAllInquiriesAction();
  return <InquiriesClient initialInquiries={result.data || []} />;
}
