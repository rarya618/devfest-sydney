import { SITE_OG_IMAGE } from '@/lib/metadata';
import { getVerifiedSession } from '@/lib/adminSession';
import { fetchPeople } from '@/lib/people';
import PeopleDashboard from '../../PeopleDashboard';

export const metadata = {
  title: 'All speakers',
  openGraph: { title: 'All speakers — GDG Sydney', images: [SITE_OG_IMAGE] },
  twitter: { card: 'summary_large_image', title: 'All speakers — GDG Sydney', images: [SITE_OG_IMAGE] },
};

export default async function PeoplePage() {
  const [, people] = await Promise.all([getVerifiedSession(), fetchPeople()]);
  return <PeopleDashboard people={people} />;
}
