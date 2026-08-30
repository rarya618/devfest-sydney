import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { areTicketsOpen } from '@/lib/tickets';
import { isCfsOpen } from '@/lib/cfs';
import FAQ from '@/components/FAQ';
import Reveal from '@/components/Reveal';
import { adminDb } from '@/lib/firebase-admin';

// The navbar ticket CTA follows the on-sale date, so this page is rendered per request
// rather than prerendered: see the note in `src/app/page.tsx`.
export const dynamic = 'force-dynamic';

const title = 'FAQ';
const description = 'Common questions about DevFest Sydney 2026 — registration, tracks, sponsorship, volunteering, and more.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/faq' },
  openGraph: {
    title: `${title} — DevFest Sydney 2026`,
    description,
    url: '/faq',
    type: 'website',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} — DevFest Sydney 2026`,
    description,
    images: ['/opengraph-image'],
  },
};

async function fetchSponsorshipProspectusUrl(): Promise<string | null> {
  try {
    const doc = await adminDb.collection('settings').doc('site').get();
    return (doc.data()?.sponsorshipProspectusUrl as string | undefined) ?? null;
  } catch {
    return null;
  }
}

export default async function FaqPage() {
  const cfsOpen = isCfsOpen();
  const cfsCloseDate = process.env.CFS_CLOSE_DATE;
  const sponsorshipProspectusUrl = await fetchSponsorshipProspectusUrl();

  return (
    <div className="bg-[#17181a] text-white min-h-screen">
      <Navbar accent="blue" isCfsOpen={cfsOpen} cfsCloseDate={cfsCloseDate} areTicketsOpen={areTicketsOpen()} />

      <section className="pt-36 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-14">Common questions</h1>
          </Reveal>
          <Reveal delay={0.1}>
            <FAQ isCfsOpen={cfsOpen} sponsorshipProspectusUrl={sponsorshipProspectusUrl} />
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
