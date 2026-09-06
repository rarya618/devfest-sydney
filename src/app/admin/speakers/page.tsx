import { getVerifiedSession } from '@/lib/adminSession';
import { fetchSpeakers } from '@/lib/speakers';
import AdminShell from '../AdminShell';
import SpeakersDashboard from '../SpeakersDashboard';

export const metadata = {
  title: 'Speakers — DevFest Sydney 2026',
  openGraph: { title: 'Speakers — DevFest Sydney 2026', images: ['/admin/opengraph-image'] },
  twitter: { card: 'summary_large_image', title: 'Speakers — DevFest Sydney 2026', images: ['/admin/opengraph-image'] },
};

export default async function SpeakersPage() {
  const admin = await getVerifiedSession();
  const speakers = await fetchSpeakers();

  return (
    <AdminShell adminEmail={admin.email} adminName={admin.name}>
      <SpeakersDashboard speakers={speakers} />
    </AdminShell>
  );
}
