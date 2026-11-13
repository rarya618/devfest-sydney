import { SITE_OG_IMAGE } from '@/lib/metadata';
import { getVerifiedSession } from '@/lib/adminSession';
import { fetchVolunteerSignups } from '@/lib/volunteers';
import VolunteersDashboard from '../../VolunteersDashboard';
import { getAdminDevfestId } from '@/lib/adminEvent';

export const metadata = {
  title: 'Volunteers',
  openGraph: { title: 'Volunteers — GDG Sydney', images: [SITE_OG_IMAGE] },
  twitter: { card: 'summary_large_image', title: 'Volunteers — GDG Sydney', images: [SITE_OG_IMAGE] },
};

export default async function VolunteersPage() {
  const eventId = await getAdminDevfestId();
  const [, volunteers] = await Promise.all([getVerifiedSession(), fetchVolunteerSignups(eventId)]);

  return <VolunteersDashboard volunteers={volunteers} />;
}
