import { getVerifiedSession } from '@/lib/adminSession';
import { fetchSubmissions } from '@/lib/submissions';
import AdminShell from '../AdminShell';
import AnalyticsView from './AnalyticsView';

export const metadata = { title: 'Analytics — DevFest Sydney 2026' };

export default async function AnalyticsPage() {
  const admin = await getVerifiedSession();
  const submissions = await fetchSubmissions();

  return (
    <AdminShell adminEmail={admin.email} adminName={admin.name}>
      <AnalyticsView submissions={submissions} />
    </AdminShell>
  );
}
