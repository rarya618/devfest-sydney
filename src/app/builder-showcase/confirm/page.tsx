import type { Metadata } from 'next';
import type { Timestamp } from 'firebase-admin/firestore';
import Image from 'next/image';
import { adminDb } from '@/lib/firebase-admin';
import { formatDeadlineDate } from '@/lib/format';
import { verifyShowcaseConfirmToken } from '@/lib/showcaseConfirm';
import { SHOWCASE_STAGE_LABELS } from '@/lib/showcaseLabels';
import type { ShowcaseStage } from '@/lib/types';
import ConfirmShowcaseDemo from './ConfirmShowcaseDemo';

// Reached only from a link in an acceptance email, and the answer depends on a Firestore
// read that changes the moment the entrant clicks, so there is nothing to prerender.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Confirm your showcase demo',
  // A personal link tied to one entry: it has no business in search results.
  robots: { index: false, follow: false },
};

interface ConfirmPageProps {
  searchParams: Promise<{ token?: string }>;
}

interface AcceptedEntry {
  projectName: string;
  stage: ShowcaseStage;
  confirmByIso: string | null;
  alreadyConfirmed: boolean;
}

async function loadAcceptedEntry(token: string): Promise<AcceptedEntry | null> {
  const entryId = verifyShowcaseConfirmToken(token);
  if (!entryId) return null;

  const snap = await adminDb.collection('showcase').doc(entryId).get();
  if (!snap.exists) return null;

  const entry = snap.data()!;
  // An acceptance that has since been undone shouldn't still be confirmable.
  if (entry.status !== 'accepted') return null;

  const confirmByDate = entry.confirmByDate as Timestamp | undefined;
  return {
    projectName: entry.projectName ?? '',
    stage: entry.stage ?? 'prototype',
    confirmByIso: confirmByDate ? confirmByDate.toDate().toISOString() : null,
    alreadyConfirmed: Boolean(entry.showcaseConfirmedAt),
  };
}

export default async function ShowcaseConfirmPage({ searchParams }: ConfirmPageProps) {
  const { token } = await searchParams;

  // A missing secret would throw inside verification. That is a server misconfiguration,
  // not a bad link, but from the entrant's side both mean "this didn't work", so both land
  // on the same message rather than a crash.
  let entry: AcceptedEntry | null = null;
  if (token) {
    try {
      entry = await loadAcceptedEntry(token);
    } catch {
      entry = null;
    }
  }

  return (
    // No navbar and no footer: this page asks one question, and every link out of it is a
    // way to leave without answering.
    <main className="bg-[#010103] text-white min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl bg-white/[0.04] border border-white/10 rounded-3xl px-8 py-12 sm:px-12 text-center">
        <Image
          src="/logo-wordmark.png"
          alt="DevFest Sydney"
          width={1331}
          height={240}
          priority
          className="h-8 w-auto object-contain mx-auto mb-10"
        />

        {!entry ? (
          <>
            <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-tight mb-5">
              This link isn&rsquo;t working
            </h1>
            <p className="text-white/70 leading-relaxed">
              We couldn&rsquo;t match this link to a Builder Showcase demo. It may have been copied
              incompletely, or something may have changed since the email went out. Reply to your
              acceptance email or write to{' '}
              <a href="mailto:hello@gdgsydney.com" className="text-google-yellow hover:underline">
                hello@gdgsydney.com
              </a>{' '}
              and we&rsquo;ll sort it out.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-tight mb-8">
              {entry.alreadyConfirmed ? 'You’re already confirmed' : 'Confirm your showcase demo'}
            </h1>

            <div className="p-6 bg-black/20 border border-white/10 rounded-2xl mb-8">
              <p className="text-xs font-mono text-white/55 mb-2">Your demo</p>
              <p className="text-xl font-bold leading-snug">{entry.projectName}</p>
              <p className="mt-2 text-sm text-google-yellow">{SHOWCASE_STAGE_LABELS[entry.stage]}</p>
            </div>

            {entry.alreadyConfirmed ? (
              <p className="text-white/70 leading-relaxed">
                Thanks, we have you down for the Builder Showcase. We&rsquo;ll be in touch closer to
                the day with the running order and when to be at the stage for a quick tech check.
              </p>
            ) : (
              <>
                <ConfirmShowcaseDemo
                  token={token!}
                  projectName={entry.projectName}
                  intro={`Let us know you'll be there to present on Saturday 10 October at Torrens University, Surry Hills.${
                    entry.confirmByIso
                      ? ` We need to hear from you by ${formatDeadlineDate(entry.confirmByIso)}, as we will need to offer your slot to someone else.`
                      : ''
                  }`}
                />
                <p className="mt-8 text-sm text-white/50 leading-relaxed">
                  Can&rsquo;t make it any more? Reply to your acceptance email and let us know as
                  soon as you can, so we can offer the slot to someone else.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
