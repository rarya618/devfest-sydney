import { getVerifiedSession } from '@/lib/adminSession';
import { fetchSubmissions } from '@/lib/submissions';
import SubmissionsDashboard from '../SubmissionsDashboard';

export const metadata = { title: 'Submissions' };

export default async function AdminPage() {
  const [, submissions] = await Promise.all([getVerifiedSession(), fetchSubmissions()]);

  return <SubmissionsDashboard submissions={submissions} />;
}
