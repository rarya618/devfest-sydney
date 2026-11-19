import { getVerifiedSession } from '@/lib/adminSession';
import { fetchVolunteerPool } from '@/lib/volunteerInvite';
import VolunteerPoolDashboard from '../../VolunteerPoolDashboard';

export const metadata = {
  title: 'Volunteer pool',
};

export const dynamic = 'force-dynamic';

export default async function VolunteerPoolPage() {
  const [, { members, events }] = await Promise.all([getVerifiedSession(), fetchVolunteerPool()]);
  return <VolunteerPoolDashboard members={members} events={events} />;
}
