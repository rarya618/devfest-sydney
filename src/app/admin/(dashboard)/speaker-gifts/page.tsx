import { SITE_OG_IMAGE } from '@/lib/metadata';
import { getVerifiedSession } from '@/lib/adminSession';
import { fetchSpeakers } from '@/lib/speakers';
import { fetchSpeakerGifts } from '@/lib/speakerThanks';
import SpeakerGiftsDashboard from '../../SpeakerGiftsDashboard';

export const metadata = {
  title: 'Speaker gifts',
  openGraph: { title: 'Speaker gifts — DevFest Sydney 2026', images: [SITE_OG_IMAGE] },
  twitter: { card: 'summary_large_image', title: 'Speaker gifts — DevFest Sydney 2026', images: [SITE_OG_IMAGE] },
};

export default async function SpeakerGiftsAdminPage() {
  const [, gifts, speakers] = await Promise.all([getVerifiedSession(), fetchSpeakerGifts(), fetchSpeakers()]);

  // Who has been thanked but hasn't answered yet, so an organiser can chase them.
  const answeredIds = new Set(gifts.map((gift) => gift.id));
  const awaitingReply = speakers
    .filter((speaker) => speaker.thanksEmailSentAt && !answeredIds.has(speaker.id))
    .map((speaker) => ({ id: speaker.id, name: speaker.name, email: speaker.email }));
  const thankedCount = speakers.filter((speaker) => speaker.thanksEmailSentAt).length;

  return <SpeakerGiftsDashboard gifts={gifts} awaitingReply={awaitingReply} thankedCount={thankedCount} />;
}
