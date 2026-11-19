import { getVerifiedSession } from '@/lib/adminSession';
import { fetchFeedbackResponses } from '@/lib/feedback';
import FeedbackDashboard from '../../../FeedbackDashboard';
import { getAdminDevfestId } from '@/lib/adminEvent';

export const metadata = {
  title: 'Feedback',
};

export default async function FeedbackAdminPage() {
  const eventId = await getAdminDevfestId();
  const [, responses] = await Promise.all([getVerifiedSession(), fetchFeedbackResponses(eventId)]);
  return <FeedbackDashboard responses={responses} />;
}
