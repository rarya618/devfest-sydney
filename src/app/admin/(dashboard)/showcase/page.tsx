import { getVerifiedSession } from '@/lib/adminSession';
import { fetchShowcaseSubmissions } from '@/lib/showcaseSubmissions';
import ShowcaseDashboard from '../../ShowcaseDashboard';

export const metadata = {
  title: 'Builder Showcase',
  openGraph: { title: 'Builder Showcase — DevFest Sydney 2026', images: ['/admin/opengraph-image'] },
  twitter: { card: 'summary_large_image', title: 'Builder Showcase — DevFest Sydney 2026', images: ['/admin/opengraph-image'] },
};

export default async function ShowcasePage() {
  const [, entries] = await Promise.all([getVerifiedSession(), fetchShowcaseSubmissions()]);

  return <ShowcaseDashboard entries={entries} />;
}
