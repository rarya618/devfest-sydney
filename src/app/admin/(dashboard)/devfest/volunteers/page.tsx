import { getVerifiedSession } from '@/lib/adminSession';
import { fetchVolunteerSignups } from '@/lib/volunteers';
import VolunteersDashboard from '../../../VolunteersDashboard';
import { getAdminDevfestId } from '@/lib/adminEvent';

export const metadata = {
  title: 'Volunteers',
};

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function VolunteersPage({ searchParams }: Props) {
  const eventId = await getAdminDevfestId();
  const [, volunteers, { status }] = await Promise.all([getVerifiedSession(), fetchVolunteerSignups(eventId), searchParams]);

  return <VolunteersDashboard volunteers={volunteers} initialStatus={status === 'pending' ? 'pending' : undefined} />;
}
