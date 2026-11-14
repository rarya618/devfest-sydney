import { getVerifiedSession } from '@/lib/adminSession';
import { fetchSubmissions } from '@/lib/submissions';
import SubmissionsDashboard from '../../../SubmissionsDashboard';
import { getAdminDevfestId } from '@/lib/adminEvent';

export const metadata = { title: 'Talk proposals' };

export default async function AdminPage() {
  const eventId = await getAdminDevfestId();
  const [, submissions] = await Promise.all([getVerifiedSession(), fetchSubmissions(eventId)]);

  return <SubmissionsDashboard submissions={submissions} />;
}
