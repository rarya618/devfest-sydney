import { SITE_OG_IMAGE } from '@/lib/metadata';
import { getVerifiedSession } from '@/lib/adminSession';
import { fetchShowcaseSubmissions } from '@/lib/showcaseSubmissions';
import ShowcaseDashboard from '../../../ShowcaseDashboard';
import { getAdminDevfestId } from '@/lib/adminEvent';

export const metadata = {
  title: 'Builder Showcase',
  openGraph: { title: 'Builder Showcase — GDG Sydney', images: [SITE_OG_IMAGE] },
  twitter: { card: 'summary_large_image', title: 'Builder Showcase — GDG Sydney', images: [SITE_OG_IMAGE] },
};

export default async function ShowcasePage() {
  const eventId = await getAdminDevfestId();
  const [, entries] = await Promise.all([getVerifiedSession(), fetchShowcaseSubmissions(eventId)]);

  return <ShowcaseDashboard entries={entries} />;
}
