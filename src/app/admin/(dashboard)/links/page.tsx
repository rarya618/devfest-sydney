import { SITE_OG_IMAGE } from '@/lib/metadata';
import { getVerifiedSession } from '@/lib/adminSession';
import LinksView from './LinksView';

export const metadata = {
  title: 'Links',
  openGraph: { title: 'Links — DevFest Sydney 2026', images: [SITE_OG_IMAGE] },
  twitter: { card: 'summary_large_image', title: 'Links — DevFest Sydney 2026', images: [SITE_OG_IMAGE] },
};

export default async function LinksPage() {
  await getVerifiedSession();

  return <LinksView />;
}
