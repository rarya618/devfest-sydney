import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';
import PublicShell from '@/components/PublicShell';
import { fetchCreditWorkshopOptions } from '@/lib/creditRequests';
import CreditRequestForm from './CreditRequestForm';

export const dynamic = 'force-dynamic';

const title = 'Request workshop credits';
const description = 'In a DevFest Sydney 2026 workshop that didn\'t go to plan? Leave your details and we\'ll send you credits to try it later.';

// Shared by link and QR in the room, like /feedback, so it stays out of search results
// and the sitemap.
export const metadata: Metadata = {
  ...buildPageMetadata({ title, description, path: '/credits' }),
  robots: { index: false, follow: false },
};

export default async function CreditsPage() {
  const workshopOptions = await fetchCreditWorkshopOptions();

  return (
    <PublicShell>
      <div className="max-w-2xl">
        <p className="font-mono text-sm text-white/60">Under a minute</p>
        <h1 className="mt-3 text-[clamp(2.25rem,6vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.02em]">Request your credits</h1>
        <p className="mt-5 mb-12 text-white/70 leading-relaxed">
          Sorry the workshop didn&apos;t go to plan. Leave your name and email and we&apos;ll send you credits
          after the event, so you can work through it in your own time.
        </p>
        <CreditRequestForm workshopOptions={workshopOptions} />
      </div>
    </PublicShell>
  );
}
