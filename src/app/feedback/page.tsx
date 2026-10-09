import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { areTicketsOpen } from '@/lib/tickets';
import { fetchFeedbackSessionOptions } from '@/lib/feedback';
import FeedbackForm from './FeedbackForm';

export const dynamic = 'force-dynamic';

const title = 'Tell us how it went';
const description = 'A short survey about DevFest Sydney 2026. Tell the organisers what worked and what to change next year.';

// Shared by QR code and link on the day, so it is kept out of search results and the
// sitemap: a survey page in a search result months later is only an invitation to spam.
export const metadata: Metadata = {
  ...buildPageMetadata({ title, description, path: '/feedback' }),
  robots: { index: false, follow: false },
};

export default async function FeedbackPage() {
  const sessionOptions = await fetchFeedbackSessionOptions();

  return (
    <div className="bg-[#010103] text-white min-h-screen">
      <Navbar areTicketsOpen={areTicketsOpen()} />

      <section className="relative pt-36 pb-10 px-6 overflow-hidden">
        <div className="absolute inset-0 hero-atmosphere pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-3xl mx-auto">
          <p className="font-mono text-sm text-white/70 mb-4 animate-fade-in">Feedback · about 3 minutes</p>
          <h1 className="text-[clamp(2.25rem,8vw,3.5rem)] font-bold leading-[1] tracking-tight text-white mb-5 animate-slide-up">
            How was DevFest Sydney?
          </h1>
          <p className="text-white/80 text-lg max-w-2xl leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Two questions are required and the rest are optional. Answers are anonymous unless you choose to
            leave your email, and every one is read by the organising team.
          </p>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <FeedbackForm sessionOptions={sessionOptions} />
        </div>
      </section>

      <Footer />
    </div>
  );
}
