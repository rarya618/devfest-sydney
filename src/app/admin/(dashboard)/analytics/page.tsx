import { SITE_OG_IMAGE } from '@/lib/metadata';
import { getVerifiedSession } from '@/lib/adminSession';
import { fetchSubmissions } from '@/lib/submissions';
import { fetchVolunteers } from '@/lib/volunteers';
import { fetchShowcaseSubmissions } from '@/lib/showcaseSubmissions';
import AnalyticsView, { isAnalyticsTab } from './AnalyticsView';

export const metadata = {
  title: 'Analytics',
  openGraph: { title: 'Analytics — DevFest Sydney 2026', images: [SITE_OG_IMAGE] },
  twitter: { card: 'summary_large_image', title: 'Analytics — DevFest Sydney 2026', images: [SITE_OG_IMAGE] },
};

interface AnalyticsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const [, { tab }, submissions, volunteers, showcaseEntries] = await Promise.all([
    getVerifiedSession(),
    searchParams,
    fetchSubmissions(),
    fetchVolunteers(),
    fetchShowcaseSubmissions(),
  ]);
  const activeTab = isAnalyticsTab(tab) ? tab : 'speakers';

  return <AnalyticsView activeTab={activeTab} submissions={submissions} volunteers={volunteers} showcaseEntries={showcaseEntries} />;
}
