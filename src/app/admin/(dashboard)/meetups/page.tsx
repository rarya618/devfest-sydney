import { SITE_OG_IMAGE } from '@/lib/metadata';
import { getVerifiedSession } from '@/lib/adminSession';
import { fetchMeetupProposals } from '@/lib/meetupProposals';
import MeetupProposalsDashboard from '../../MeetupProposalsDashboard';

export const metadata = {
  title: 'Meetup talks',
  openGraph: { title: 'Meetup talks — GDG Sydney', images: [SITE_OG_IMAGE] },
  twitter: { card: 'summary_large_image', title: 'Meetup talks — GDG Sydney', images: [SITE_OG_IMAGE] },
};

export default async function MeetupProposalsPage() {
  const [, proposals] = await Promise.all([getVerifiedSession(), fetchMeetupProposals()]);

  return <MeetupProposalsDashboard proposals={proposals} />;
}
