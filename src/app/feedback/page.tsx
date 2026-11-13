import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';
import PublicShell from '@/components/PublicShell';
import { FEEDBACK_EVENT_ID, fetchFeedbackSessionOptions } from '@/lib/feedback';
import { loadEvent } from '@/lib/events';
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
  // Pinned to one event (FEEDBACK_EVENT_ID in src/lib/feedback.ts), and named from it.
  const [sessionOptions, event] = await Promise.all([fetchFeedbackSessionOptions(), loadEvent(FEEDBACK_EVENT_ID).catch(() => null)]);
  const eventName = event?.name ?? 'DevFest Sydney';

  return (
    <PublicShell>
      <div className="max-w-3xl">
        <p className="font-mono text-sm text-white/60">About 3 minutes</p>
        <h1 className="mt-3 text-[clamp(2.25rem,6vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.02em]">How was {eventName}?</h1>
        <p className="mt-5 mb-12 max-w-2xl text-white/70 leading-relaxed">
          Two questions are required and the rest are optional. Answers are anonymous unless you choose to
          leave your email, and every one is read by the organising team.
        </p>
        <FeedbackForm sessionOptions={sessionOptions} eventName={eventName} />
      </div>
    </PublicShell>
  );
}
