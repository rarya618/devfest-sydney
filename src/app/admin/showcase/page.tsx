import { getVerifiedSession } from '@/lib/adminSession';
import { fetchShowcaseSubmissions } from '@/lib/showcaseSubmissions';
import AdminShell from '../AdminShell';
import ShowcaseDashboard from '../ShowcaseDashboard';

export const metadata = {
  title: 'Builder Showcase — DevFest Sydney 2026',
  openGraph: { title: 'Builder Showcase — DevFest Sydney 2026', images: ['/admin/opengraph-image'] },
  twitter: { card: 'summary_large_image', title: 'Builder Showcase — DevFest Sydney 2026', images: ['/admin/opengraph-image'] },
};

export default async function ShowcasePage() {
  const admin = await getVerifiedSession();
  const entries = await fetchShowcaseSubmissions();

  return (
    <AdminShell adminEmail={admin.email} adminName={admin.name}>
      <ShowcaseDashboard entries={entries} />
    </AdminShell>
  );
}
