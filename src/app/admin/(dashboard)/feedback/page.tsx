import { SITE_OG_IMAGE } from '@/lib/metadata';
import { getVerifiedSession } from '@/lib/adminSession';
import { fetchFeedbackResponses } from '@/lib/feedback';
import FeedbackDashboard from '../../FeedbackDashboard';

export const metadata = {
  title: 'Feedback',
  openGraph: { title: 'Feedback — DevFest Sydney 2026', images: [SITE_OG_IMAGE] },
  twitter: { card: 'summary_large_image', title: 'Feedback — DevFest Sydney 2026', images: [SITE_OG_IMAGE] },
};

export default async function FeedbackAdminPage() {
  const [, responses] = await Promise.all([getVerifiedSession(), fetchFeedbackResponses()]);
  return <FeedbackDashboard responses={responses} />;
}
