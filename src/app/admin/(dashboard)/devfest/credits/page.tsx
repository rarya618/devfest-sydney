import { getVerifiedSession } from '@/lib/adminSession';
import { fetchCreditRequests } from '@/lib/creditRequests';
import CreditRequestsDashboard from '../../../CreditRequestsDashboard';

export const metadata = {
  title: 'Credits',
};

export default async function CreditRequestsAdminPage() {
  const [, requests] = await Promise.all([getVerifiedSession(), fetchCreditRequests()]);
  return <CreditRequestsDashboard requests={requests} />;
}
