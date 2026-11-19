import { getVerifiedSession } from '@/lib/adminSession';
import { fetchSubmissions } from '@/lib/submissions';
import { fetchVolunteerSignups } from '@/lib/volunteers';
import { fetchShowcaseSubmissions } from '@/lib/showcaseSubmissions';
import AnalyticsView, { isAnalyticsTab } from './AnalyticsView';
import { getAdminDevfestId } from '@/lib/adminEvent';

export const metadata = {
  title: 'Form results',
};

interface AnalyticsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const eventId = await getAdminDevfestId();
  const [, { tab }, submissions, volunteers, showcaseEntries] = await Promise.all([
    getVerifiedSession(),
    searchParams,
    fetchSubmissions(eventId),
    fetchVolunteerSignups(eventId),
    fetchShowcaseSubmissions(eventId),
  ]);
  const activeTab = isAnalyticsTab(tab) ? tab : 'speakers';

  return <AnalyticsView activeTab={activeTab} submissions={submissions} volunteers={volunteers} showcaseEntries={showcaseEntries} />;
}
