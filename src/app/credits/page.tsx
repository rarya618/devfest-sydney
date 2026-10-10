import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { areTicketsOpen } from '@/lib/tickets';
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
    <div className="bg-[#010103] text-white min-h-screen">
      <Navbar areTicketsOpen={areTicketsOpen()} />

      <section className="relative pt-36 pb-10 px-6 overflow-hidden">
        <div className="absolute inset-0 hero-atmosphere pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-2xl mx-auto">
          <p className="font-mono text-sm text-white/70 mb-4 animate-fade-in">Workshop credits · under a minute</p>
          <h1 className="text-[clamp(2.25rem,8vw,3.5rem)] font-bold leading-[1] tracking-tight text-white mb-5 animate-slide-up">
            Request your credits
          </h1>
          <p className="text-white/80 text-lg leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Sorry the workshop didn&apos;t go to plan. Leave your name and email and we&apos;ll send you credits
            after the event, so you can work through it in your own time.
          </p>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <CreditRequestForm workshopOptions={workshopOptions} />
        </div>
      </section>

      <Footer />
    </div>
  );
}
