import { SITE_OG_IMAGE } from '@/lib/metadata';
import { getVerifiedSession } from '@/lib/adminSession';
import { fetchCreditRequests } from '@/lib/creditRequests';
import CreditRequestsDashboard from '../../CreditRequestsDashboard';

export const metadata = {
  title: 'Credits',
  openGraph: { title: 'Credits — DevFest Sydney 2026', images: [SITE_OG_IMAGE] },
  twitter: { card: 'summary_large_image', title: 'Credits — DevFest Sydney 2026', images: [SITE_OG_IMAGE] },
};

export default async function CreditRequestsAdminPage() {
  const [, requests] = await Promise.all([getVerifiedSession(), fetchCreditRequests()]);
  return <CreditRequestsDashboard requests={requests} />;
}
