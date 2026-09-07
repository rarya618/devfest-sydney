import { getVerifiedSession } from '@/lib/adminSession';
import { fetchSubmissions } from '@/lib/submissions';
import { fetchVolunteers } from '@/lib/volunteers';
import { fetchShowcaseSubmissions } from '@/lib/showcaseSubmissions';
import AdminShell from '../AdminShell';
import AnalyticsView, { isAnalyticsTab } from './AnalyticsView';

export const metadata = {
  title: 'Analytics',
  openGraph: { title: 'Analytics — DevFest Sydney 2026', images: ['/admin/opengraph-image'] },
  twitter: { card: 'summary_large_image', title: 'Analytics — DevFest Sydney 2026', images: ['/admin/opengraph-image'] },
};

interface AnalyticsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const admin = await getVerifiedSession();
  const { tab } = await searchParams;
  const activeTab = isAnalyticsTab(tab) ? tab : 'speakers';

  const [submissions, volunteers, showcaseEntries] = await Promise.all([
    fetchSubmissions(),
    fetchVolunteers(),
    fetchShowcaseSubmissions(),
  ]);

  return (
    <AdminShell adminEmail={admin.email} adminName={admin.name}>
      <AnalyticsView activeTab={activeTab} submissions={submissions} volunteers={volunteers} showcaseEntries={showcaseEntries} />
    </AdminShell>
  );
}
