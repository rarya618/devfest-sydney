import { SITE_OG_IMAGE } from '@/lib/metadata';
import { getVerifiedSession } from '@/lib/adminSession';
import { fetchSpeakers } from '@/lib/speakers';
import { fetchSessionTimesByTalkId } from '@/lib/schedule';
import SpeakersDashboard from '../../SpeakersDashboard';
import { getAdminDevfestId } from '@/lib/adminEvent';

export const metadata = {
  title: 'Speakers',
  openGraph: { title: 'Speakers — GDG Sydney', images: [SITE_OG_IMAGE] },
  twitter: { card: 'summary_large_image', title: 'Speakers — GDG Sydney', images: [SITE_OG_IMAGE] },
};

export default async function SpeakersPage() {
  // Null when the schedule can't be read, so the dashboard hides the calendar controls
  // rather than reading every speaker as unscheduled and offering cancellations.
  const eventId = await getAdminDevfestId();
  const [, speakers, sessionTimes] = await Promise.all([
    getVerifiedSession(),
    fetchSpeakers(eventId),
    fetchSessionTimesByTalkId(eventId).catch(() => null),
  ]);

  return <SpeakersDashboard speakers={speakers} sessionTimes={sessionTimes} />;
}
