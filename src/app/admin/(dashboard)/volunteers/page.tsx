import { getVerifiedSession } from '@/lib/adminSession';
import { fetchVolunteers } from '@/lib/volunteers';
import VolunteersDashboard from '../../VolunteersDashboard';

export const metadata = {
  title: 'Volunteers',
  openGraph: { title: 'Volunteers — DevFest Sydney 2026', images: ['/admin/opengraph-image'] },
  twitter: { card: 'summary_large_image', title: 'Volunteers — DevFest Sydney 2026', images: ['/admin/opengraph-image'] },
};

export default async function VolunteersPage() {
  const [, volunteers] = await Promise.all([getVerifiedSession(), fetchVolunteers()]);

  return <VolunteersDashboard volunteers={volunteers} />;
}
