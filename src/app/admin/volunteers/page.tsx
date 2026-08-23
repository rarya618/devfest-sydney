import { getVerifiedSession } from '@/lib/adminSession';
import { fetchVolunteers } from '@/lib/volunteers';
import AdminShell from '../AdminShell';
import VolunteersDashboard from '../VolunteersDashboard';

export const metadata = {
  title: 'Volunteers — DevFest Sydney 2026',
  openGraph: { title: 'Volunteers — DevFest Sydney 2026', images: ['/admin/opengraph-image'] },
  twitter: { card: 'summary_large_image', title: 'Volunteers — DevFest Sydney 2026', images: ['/admin/opengraph-image'] },
};

export default async function VolunteersPage() {
  const admin = await getVerifiedSession();
  const volunteers = await fetchVolunteers();

  return (
    <AdminShell adminEmail={admin.email} adminName={admin.name}>
      <VolunteersDashboard volunteers={volunteers} />
    </AdminShell>
  );
}
