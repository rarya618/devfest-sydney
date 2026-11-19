import { getVerifiedSession } from '@/lib/adminSession';
import LinksView from './LinksView';

export const metadata = {
  title: 'Links',
};

export default async function LinksPage() {
  await getVerifiedSession();

  return <LinksView />;
}
