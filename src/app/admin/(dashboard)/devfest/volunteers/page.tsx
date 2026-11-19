import { getVerifiedSession } from '@/lib/adminSession';
import { fetchVolunteerSignups } from '@/lib/volunteers';
import VolunteersDashboard from '../../../VolunteersDashboard';
import { getAdminDevfestId } from '@/lib/adminEvent';

export const metadata = {
  title: 'Volunteers',
};

export default async function VolunteersPage() {
  const eventId = await getAdminDevfestId();
  const [, volunteers] = await Promise.all([getVerifiedSession(), fetchVolunteerSignups(eventId)]);

  return <VolunteersDashboard volunteers={volunteers} />;
}
