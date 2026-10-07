import { SITE_OG_IMAGE } from '@/lib/metadata';
import { getVerifiedSession } from '@/lib/adminSession';
import { fetchJobListings, fetchJobSeekers } from '@/lib/jobBoard';
import { fetchSponsors } from '@/lib/sponsors';
import JobBoardDashboard from '../../JobBoardDashboard';

export const metadata = {
  title: 'Job board',
  openGraph: { title: 'Job board — DevFest Sydney 2026', images: [SITE_OG_IMAGE] },
  twitter: { card: 'summary_large_image', title: 'Job board — DevFest Sydney 2026', images: [SITE_OG_IMAGE] },
};

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

// Two tabs as plain links (?tab=people), like /admin/analytics, so a view is bookmarkable
// and the page stays a server component. Roles is the bare URL.
export default async function JobBoardAdminPage({ searchParams }: Props) {
  const [{ tab }, , listings, seekers, sponsors] = await Promise.all([
    searchParams,
    getVerifiedSession(),
    fetchJobListings(),
    fetchJobSeekers(),
    fetchSponsors(),
  ]);

  return (
    <JobBoardDashboard
      activeTab={tab === 'people' ? 'people' : 'roles'}
      listings={listings}
      seekers={seekers}
      sponsors={sponsors.map((sponsor) => ({ id: sponsor.id, name: sponsor.name, tier: sponsor.tier }))}
    />
  );
}
