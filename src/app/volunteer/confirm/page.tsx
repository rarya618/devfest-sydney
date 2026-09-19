import type { Metadata } from 'next';
import type { Timestamp } from 'firebase-admin/firestore';
import Image from 'next/image';
import { adminDb } from '@/lib/firebase-admin';
import { formatDeadlineDate } from '@/lib/format';
import { verifyVolunteerConfirmToken, volunteerTicketUrl, volunteerWhatsappUrl } from '@/lib/volunteerConfirm';
import { VOLUNTEER_AREA_LABELS, VOLUNTEER_SHIFT_LABELS } from '@/lib/volunteerLabels';
import type { VolunteerArea, VolunteerShift } from '@/lib/types';
import ConfirmVolunteering from './ConfirmVolunteering';
import VolunteerNextSteps from './VolunteerNextSteps';

// Reached only from a link in an acceptance email, and the answer depends on a Firestore
// read that changes the moment the volunteer clicks, so there is nothing to prerender.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Confirm your volunteer spot',
  // A personal link tied to one signup: it has no business in search results.
  robots: { index: false, follow: false },
};

interface ConfirmPageProps {
  searchParams: Promise<{ token?: string }>;
}

interface AcceptedVolunteer {
  name: string;
  assignedArea: VolunteerArea | '';
  assignedShift: VolunteerShift;
  confirmByIso: string | null;
  alreadyConfirmed: boolean;
  ticketAlreadySent: boolean;
}

async function loadAcceptedVolunteer(token: string): Promise<AcceptedVolunteer | null> {
  const volunteerId = verifyVolunteerConfirmToken(token);
  if (!volunteerId) return null;

  const snap = await adminDb.collection('volunteers').doc(volunteerId).get();
  if (!snap.exists) return null;

  const volunteer = snap.data()!;
  // An acceptance that has since been undone shouldn't still be confirmable.
  if (volunteer.status !== 'accepted') return null;

  const confirmByDate = volunteer.confirmByDate as Timestamp | undefined;
  return {
    name: volunteer.name ?? '',
    assignedArea: volunteer.assignedArea ?? '',
    assignedShift: volunteer.assignedShift ?? '',
    confirmByIso: confirmByDate ? confirmByDate.toDate().toISOString() : null,
    alreadyConfirmed: Boolean(volunteer.volunteerConfirmedAt),
    ticketAlreadySent: Boolean(volunteer.ticketSentAt),
  };
}

export default async function VolunteerConfirmPage({ searchParams }: ConfirmPageProps) {
  const { token } = await searchParams;

  // A missing secret would throw inside verification. That is a server misconfiguration,
  // not a bad link, but from the volunteer's side both mean "this didn't work", so both
  // land on the same message rather than a crash.
  let volunteer: AcceptedVolunteer | null = null;
  if (token) {
    try {
      volunteer = await loadAcceptedVolunteer(token);
    } catch {
      volunteer = null;
    }
  }

  const hasRoster = Boolean(volunteer?.assignedArea || volunteer?.assignedShift);

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

        {!volunteer ? (
          <>
            <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-tight mb-5">
              This link isn&rsquo;t working
            </h1>
            <p className="text-white/70 leading-relaxed">
              We couldn&rsquo;t match this link to a volunteer spot. It may have been copied
              incompletely, or something may have changed since the email went out. Reply to your
              acceptance email or write to{' '}
              <a href="mailto:hello@gdgsydney.com" className="text-google-green hover:underline">
                hello@gdgsydney.com
              </a>{' '}
              and we&rsquo;ll sort it out.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-tight mb-8">
              {volunteer.alreadyConfirmed ? 'You’re already confirmed' : 'Confirm your volunteer spot'}
            </h1>

            <div className="p-6 bg-black/20 border border-white/10 rounded-2xl mb-8">
              <p className="text-xs font-mono text-white/55 mb-2">Your spot on the crew</p>
              {hasRoster ? (
                <p className="text-xl font-bold leading-snug">
                  {volunteer.assignedArea ? VOLUNTEER_AREA_LABELS[volunteer.assignedArea] : 'Volunteer crew'}
                  {volunteer.assignedShift && (
                    <span className="text-white/55"> &middot; {VOLUNTEER_SHIFT_LABELS[volunteer.assignedShift]}</span>
                  )}
                </p>
              ) : (
                <>
                  <p className="text-xl font-bold leading-snug">Volunteer crew</p>
                  <p className="mt-2 text-sm text-white/55 leading-relaxed">
                    We&rsquo;re still working out the roster, and we&rsquo;ll confirm your area and
                    shift closer to the event.
                  </p>
                </>
              )}
            </div>

            {volunteer.alreadyConfirmed ? (
              <>
                <p className="text-white/70 leading-relaxed">
                  Thanks, we have you down for the day. We&rsquo;ll be in touch closer to the day
                  with the run sheet, your arrival time, and who to find when you get there.
                </p>
                {/* Rendered only on this branch: the links belong to someone who has said yes. */}
                <VolunteerNextSteps
                  ticketUrl={volunteer.ticketAlreadySent ? null : volunteerTicketUrl()}
                  ticketAlreadySent={volunteer.ticketAlreadySent}
                  whatsappUrl={volunteerWhatsappUrl()}
                />
              </>
            ) : (
              <>
                <ConfirmVolunteering
                  token={token!}
                  name={volunteer.name}
                  intro={`Let us know you can still join us on Saturday 10 October at Torrens University, Surry Hills.${
                    volunteer.confirmByIso
                      ? ` We need to hear from you by ${formatDeadlineDate(volunteer.confirmByIso)}, as we will need to offer the spot to someone else.`
                      : ''
                  }`}
                />
                <p className="mt-8 text-sm text-white/50 leading-relaxed">
                  Can&rsquo;t make it any more? Reply to your acceptance email and let us know as
                  soon as you can, so we can offer the spot to someone else.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
