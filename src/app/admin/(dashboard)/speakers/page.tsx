import { SITE_OG_IMAGE } from '@/lib/metadata';
import { getVerifiedSession } from '@/lib/adminSession';
import { fetchSpeakers } from '@/lib/speakers';
import SpeakersDashboard from '../../SpeakersDashboard';

export const metadata = {
  title: 'Speakers',
  openGraph: { title: 'Speakers — DevFest Sydney 2026', images: [SITE_OG_IMAGE] },
  twitter: { card: 'summary_large_image', title: 'Speakers — DevFest Sydney 2026', images: [SITE_OG_IMAGE] },
};

export default async function SpeakersPage() {
  const [, speakers] = await Promise.all([getVerifiedSession(), fetchSpeakers()]);

  return <SpeakersDashboard speakers={speakers} />;
}
