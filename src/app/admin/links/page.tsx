import { getVerifiedSession } from '@/lib/adminSession';
import AdminShell from '../AdminShell';
import LinksView from './LinksView';

export const metadata = {
  title: 'Links — DevFest Sydney 2026',
  openGraph: { title: 'Links — DevFest Sydney 2026', images: ['/admin/opengraph-image'] },
  twitter: { card: 'summary_large_image', title: 'Links — DevFest Sydney 2026', images: ['/admin/opengraph-image'] },
};

export default async function LinksPage() {
  const admin = await getVerifiedSession();

  return (
    <AdminShell adminEmail={admin.email} adminName={admin.name}>
      <LinksView />
    </AdminShell>
  );
}
