import type { Metadata } from 'next';
import type { Timestamp } from 'firebase-admin/firestore';
import Image from 'next/image';
import { adminDb } from '@/lib/firebase-admin';
import { formatDeadlineDate } from '@/lib/format';
import { verifySpeakerConfirmToken } from '@/lib/speakerConfirm';
import ConfirmParticipation from './ConfirmParticipation';

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
}

async function loadAcceptedTalk(token: string): Promise<AcceptedTalk | null> {
  const submissionId = verifySpeakerConfirmToken(token);
  if (!submissionId) return null;

  const snap = await adminDb.collection('submissions').doc(submissionId).get();
  if (!snap.exists) return null;

  const submission = snap.data()!;
  // An acceptance that has since been undone shouldn't still be confirmable.
  if (submission.status !== 'accepted') return null;

  const confirmByDate = submission.confirmByDate as Timestamp | undefined;
  return {
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
    <main className="bg-[#17181a] text-white min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl bg-white/[0.04] border border-white/10 rounded-3xl px-8 py-12 sm:px-12 text-center">
        <Image
          src="/logo-wordmark.png"
          alt="DevFest Sydney"
          width={1331}
          height={240}
          priority
          className="h-8 w-auto object-contain mx-auto mb-10"
        />

        {!talk ? (
          <>
            <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-tight mb-5">
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
            <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-tight mb-8">
              {talk.alreadyConfirmed ? 'You’re already confirmed' : 'Confirm your talk'}
            </h1>

            <div className="p-6 bg-black/20 border border-white/10 rounded-2xl mb-8">
              <p className="text-xs font-mono text-white/45 mb-2">Your accepted talk</p>
              <p className="text-xl font-bold leading-snug">{talk.talkTitle}</p>
            </div>

            {talk.alreadyConfirmed ? (
              <p className="text-white/70 leading-relaxed">
                Thanks, we have you down as speaking. We&rsquo;ll be in touch with your speaker
                ticket and the running order for the day.
              </p>
            ) : (
              <>
                <ConfirmParticipation
                  token={token!}
                  talkTitle={talk.talkTitle}
                  intro={`Let us know you'll be joining us on Saturday 10 October at Torrens University, Surry Hills.${
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
    </main>
  );
}
