import { SITE_OG_IMAGE } from '@/lib/metadata';
import { getVerifiedSession } from '@/lib/adminSession';
import { fetchSpeakers } from '@/lib/speakers';
import { fetchSessionTimesBySpeakerId } from '@/lib/schedule';
import SpeakersDashboard from '../../SpeakersDashboard';

export const metadata = {
  title: 'Speakers',
  openGraph: { title: 'Speakers — DevFest Sydney 2026', images: [SITE_OG_IMAGE] },
  twitter: { card: 'summary_large_image', title: 'Speakers — DevFest Sydney 2026', images: [SITE_OG_IMAGE] },
};

export default async function SpeakersPage() {
  // Null when the schedule can't be read, so the dashboard hides the calendar controls
  // rather than reading every speaker as unscheduled and offering cancellations.
  const [, speakers, sessionTimes] = await Promise.all([
    getVerifiedSession(),
    fetchSpeakers(),
    fetchSessionTimesBySpeakerId().catch(() => null),
  ]);

  return <SpeakersDashboard speakers={speakers} sessionTimes={sessionTimes} />;
}
