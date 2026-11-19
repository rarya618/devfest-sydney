import { getVerifiedSession } from '@/lib/adminSession';
import { fetchShowcaseSubmissions } from '@/lib/showcaseSubmissions';
import ShowcaseDashboard from '../../../ShowcaseDashboard';
import { getAdminDevfestId } from '@/lib/adminEvent';

export const metadata = {
  title: 'Builder Showcase',
};

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function ShowcasePage({ searchParams }: Props) {
  const eventId = await getAdminDevfestId();
  const [, entries, { status }] = await Promise.all([getVerifiedSession(), fetchShowcaseSubmissions(eventId), searchParams]);

  return <ShowcaseDashboard entries={entries} initialStatus={status === 'pending' ? 'pending' : undefined} />;
}
