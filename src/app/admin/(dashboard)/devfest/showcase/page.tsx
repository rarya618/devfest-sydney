import { getVerifiedSession } from '@/lib/adminSession';
import { fetchShowcaseSubmissions } from '@/lib/showcaseSubmissions';
import ShowcaseDashboard from '../../../ShowcaseDashboard';
import { getAdminDevfestId } from '@/lib/adminEvent';

export const metadata = {
  title: 'Builder Showcase',
};

export default async function ShowcasePage() {
  const eventId = await getAdminDevfestId();
  const [, entries] = await Promise.all([getVerifiedSession(), fetchShowcaseSubmissions(eventId)]);

  return <ShowcaseDashboard entries={entries} />;
}
