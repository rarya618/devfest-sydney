import { SITE_OG_IMAGE } from '@/lib/metadata';
import { getVerifiedSession } from '@/lib/adminSession';
import { fetchCrew } from '@/lib/volunteers';
import CrewDashboard from '../../CrewDashboard';
import { getAdminDevfestId } from '@/lib/adminEvent';

export const metadata = {
  title: 'Crew',
  openGraph: { title: 'Crew — DevFest Sydney 2026', images: [SITE_OG_IMAGE] },
  twitter: { card: 'summary_large_image', title: 'Crew — DevFest Sydney 2026', images: [SITE_OG_IMAGE] },
};

export default async function CrewPage() {
  const eventId = await getAdminDevfestId();
  const [, crew] = await Promise.all([getVerifiedSession(), fetchCrew(eventId)]);

  return <CrewDashboard crew={crew} />;
}
