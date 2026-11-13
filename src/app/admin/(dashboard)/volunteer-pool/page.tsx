import { SITE_OG_IMAGE } from '@/lib/metadata';
import { getVerifiedSession } from '@/lib/adminSession';
import { fetchVolunteerPool } from '@/lib/volunteerInvite';
import VolunteerPoolDashboard from '../../VolunteerPoolDashboard';

export const metadata = {
  title: 'Volunteer pool',
  openGraph: { title: 'Volunteer pool — GDG Sydney', images: [SITE_OG_IMAGE] },
  twitter: { card: 'summary_large_image', title: 'Volunteer pool — GDG Sydney', images: [SITE_OG_IMAGE] },
};

export const dynamic = 'force-dynamic';

export default async function VolunteerPoolPage() {
  const [, { members, events }] = await Promise.all([getVerifiedSession(), fetchVolunteerPool()]);
  return <VolunteerPoolDashboard members={members} events={events} />;
}
