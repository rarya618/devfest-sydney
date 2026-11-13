import type { Metadata } from 'next';
import PublicShell from '@/components/PublicShell';
import type { Timestamp } from 'firebase-admin/firestore';
import { loadSpeakerProposal } from '@/lib/speakerProposals';
import { formatDeadlineDate } from '@/lib/format';
import { verifySpeakerConfirmToken } from '@/lib/speakerConfirm';
import ConfirmParticipation from './ConfirmParticipation';
import SpeakerNextSteps from './SpeakerNextSteps';
import { fetchEventLink, loadEvent } from '@/lib/events';
import { formatEveningBefore, formatEventWhen, isDevfest, toEventCopy, type EventCopy } from '@/lib/eventCopy';

// Reached only from a link in an acceptance email, and the answer depends on a Firestore
// read that changes the moment the speaker clicks, so there is nothing to prerender.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Confirm your talk',
  // A personal link tied to one submission: it has no business in search results.
  robots: { index: false, follow: false },
};

interface ConfirmPageProps {
  searchParams: Promise<{ token?: string }>;
}

interface AcceptedTalk {
  talkTitle: string;
  name: string;
  confirmByIso: string | null;
  alreadyConfirmed: boolean;
  eventId: string;
  event: EventCopy | null;
}

async function loadAcceptedTalk(token: string): Promise<AcceptedTalk | null> {
  const submissionId = verifySpeakerConfirmToken(token);
  if (!submissionId) return null;

  // A DevFest proposal or a meetup one (stage 4f).
  const proposal = await loadSpeakerProposal(submissionId);
  if (!proposal) return null;

  const submission = proposal.data;
  // An acceptance that has since been undone shouldn't still be confirmable.
  if (submission.status !== 'accepted') return null;

  const confirmByDate = submission.confirmByDate as Timestamp | undefined;
  // The proposal's own event (stage 4e) words the page and supplies the ticket link.
  const eventId = String(submission.eventId ?? '');
  const event = await loadEvent(eventId).catch(() => null);
  return {
    eventId,
    event: event ? toEventCopy(event) : null,
    talkTitle: submission.talkTitle ?? '',
    name: submission.name ?? '',
    confirmByIso: confirmByDate ? confirmByDate.toDate().toISOString() : null,
    alreadyConfirmed: Boolean(submission.speakerConfirmedAt),
  };
}

export default async function SpeakerConfirmPage({ searchParams }: ConfirmPageProps) {
  const { token } = await searchParams;

  // A missing secret would throw inside verification. That is a server misconfiguration,
  // not a bad link, but from the speaker's side both mean "this didn't work", so both land
  // on the same message rather than a crash.
  let talk: AcceptedTalk | null = null;
  if (token) {
    try {
      talk = await loadAcceptedTalk(token);
    } catch {
      talk = null;
    }
  }

  return (
    // No navbar and no footer: this page asks one question, and every link out of it is a
    // way to leave without answering.
    <PublicShell minimal>
      <div className="max-w-xl">

        {!talk ? (
          <>
            <h1 className="text-[clamp(2.25rem,6vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.02em] mb-5">
              This link isn&rsquo;t working
            </h1>
            <p className="text-white/70 leading-relaxed">
              We couldn&rsquo;t match this link to an accepted talk. It may have been copied
              incompletely, or the acceptance may have changed since the email went out. Reply to
              your acceptance email or write to{' '}
              <a href="mailto:hello@gdgsydney.com" className="text-google-green hover:underline">
                hello@gdgsydney.com
              </a>{' '}
              and we&rsquo;ll sort it out.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-[clamp(2.25rem,6vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.02em] mb-8">
              {talk.alreadyConfirmed ? 'You’re already confirmed' : 'Confirm your talk'}
            </h1>

            <div className="p-6 bg-surface rounded-3xl mb-8">
              <p className="text-xs font-mono text-white/55 mb-2">Your accepted talk</p>
              <p className="text-xl font-bold leading-snug">{talk.talkTitle}</p>
            </div>

            {talk.alreadyConfirmed ? (
              <>
                <p className="text-white/70 leading-relaxed">
                  Thanks, we have you down as speaking. We&rsquo;ll be in touch with the running
                  order for the day.
                </p>
                <SpeakerNextSteps
                  ticketUrl={await fetchEventLink(talk.eventId, 'speakerTicketUrl')}
                  dinnerLabel={talk.event && isDevfest(talk.event) ? formatEveningBefore(talk.event) : null}
                />
              </>
            ) : (
              <>
                <ConfirmParticipation
                  token={token!}
                  talkTitle={talk.talkTitle}
                  dinnerLabel={talk.event && isDevfest(talk.event) ? formatEveningBefore(talk.event) : null}
                  intro={`Let us know you'll be joining us${talk.event ? ` on ${formatEventWhen(talk.event)}` : ''}.${
                    talk.confirmByIso
                      ? ` We need to hear from you by ${formatDeadlineDate(talk.confirmByIso)}, as we will need to reach out to other speakers to fill in the spot.`
                      : ''
                  }`}
                />
                <p className="mt-8 text-sm text-white/50 leading-relaxed">
                  Can&rsquo;t make it any more? Reply to your acceptance email and let us know as
                  soon as you can.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </PublicShell>
  );
}
