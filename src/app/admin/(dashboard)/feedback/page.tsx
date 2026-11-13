import { SITE_OG_IMAGE } from '@/lib/metadata';
import { getVerifiedSession } from '@/lib/adminSession';
import { fetchFeedbackResponses } from '@/lib/feedback';
import FeedbackDashboard from '../../FeedbackDashboard';
import { getAdminDevfestId } from '@/lib/adminEvent';

export const metadata = {
  title: 'Feedback',
  openGraph: { title: 'Feedback — GDG Sydney', images: [SITE_OG_IMAGE] },
  twitter: { card: 'summary_large_image', title: 'Feedback — GDG Sydney', images: [SITE_OG_IMAGE] },
};

export default async function FeedbackAdminPage() {
  const eventId = await getAdminDevfestId();
  const [, responses] = await Promise.all([getVerifiedSession(), fetchFeedbackResponses(eventId)]);
  return <FeedbackDashboard responses={responses} />;
}
