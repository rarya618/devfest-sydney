import { getVerifiedSession } from '@/lib/adminSession';
import { fetchSubmissions } from '@/lib/submissions';
import AdminShell from './AdminShell';
import SubmissionsDashboard from './SubmissionsDashboard';

export const metadata = { title: 'Admin — DevFest Sydney 2026' };

export default async function AdminPage() {
  const admin = await getVerifiedSession();
  const submissions = await fetchSubmissions();

  return (
    <AdminShell adminEmail={admin.email} adminName={admin.name}>
      <SubmissionsDashboard submissions={submissions} />
    </AdminShell>
  );
}
