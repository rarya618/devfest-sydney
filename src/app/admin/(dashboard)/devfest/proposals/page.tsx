import { getVerifiedSession } from '@/lib/adminSession';
import { fetchSubmissions } from '@/lib/submissions';
import SubmissionsDashboard from '../../../SubmissionsDashboard';
import { getAdminDevfestId } from '@/lib/adminEvent';

export const metadata = { title: 'Talk proposals' };

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminPage({ searchParams }: Props) {
  const eventId = await getAdminDevfestId();
  const [, submissions, { status }] = await Promise.all([getVerifiedSession(), fetchSubmissions(eventId), searchParams]);

  return <SubmissionsDashboard submissions={submissions} initialStatus={status === 'pending' ? 'pending' : undefined} />;
}
