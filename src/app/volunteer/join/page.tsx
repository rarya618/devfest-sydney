import type { Metadata } from 'next';
import Image from 'next/image';
import { loadVolunteerInvite, type VolunteerInvite } from '@/lib/volunteerInvite';
import JoinForm from './JoinForm';

export const metadata: Metadata = {
  title: 'Volunteer again',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface JoinPageProps {
  searchParams: Promise<{ token?: string }>;
}

function formatEventDay(event: VolunteerInvite['event']): string {
  return new Date(event.startAt).toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: event.timeZone,
  });
}

// Where an "Invite past volunteers" email lands (stage 4d-2, PM.md). Like /volunteer/confirm:
// no navbar or footer, and nothing is written on page load (mail scanners fetch links), only
// when the form is sent.
export default async function VolunteerJoinPage({ searchParams }: JoinPageProps) {
  const { token } = await searchParams;

  let invite: VolunteerInvite | null = null;
  if (token) {
    try {
      invite = await loadVolunteerInvite(token);
    } catch {
      invite = null;
    }
  }

  return (
    <main className="bg-[#010103] text-white min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl bg-white/[0.04] border border-white/10 rounded-3xl px-8 py-12 sm:px-12 text-center">
        <Image src="/logo-wordmark.png" alt="DevFest Sydney" width={1331} height={240} priority className="h-8 w-auto object-contain mx-auto mb-10" />

        {!invite ? (
          <>
            <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-tight mb-5">This link isn&rsquo;t working</h1>
            <p className="text-white/70 leading-relaxed">
              We couldn&rsquo;t match this link to an invite. It may have been copied incompletely. Write to{' '}
              <a href="mailto:hello@gdgsydney.com" className="text-google-green hover:underline">hello@gdgsydney.com</a> and we&rsquo;ll sort it out.
            </p>
          </>
        ) : invite.alreadySignedUp ? (
          <>
            <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-tight mb-5">You&rsquo;re already signed up</h1>
            <p className="text-white/70 leading-relaxed">
              We have you down to volunteer at {invite.event.name}. We&rsquo;ll email you to confirm your spot.
            </p>
          </>
        ) : invite.closedReason ? (
          <>
            <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-tight mb-5">This invite has closed</h1>
            <p className="text-white/70 leading-relaxed">{invite.closedReason} Thanks for wanting to help, and keep an eye out for the next one.</p>
          </>
        ) : (
          <>
            <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-tight mb-3">
              Crew {invite.event.name}?
            </h1>
            <p className="font-mono text-sm text-google-green mb-8">
              {formatEventDay(invite.event)}
              {invite.event.venue ? ` · ${invite.event.venue.name}` : ''}
            </p>

            <div className="p-5 bg-black/20 border border-white/10 rounded-2xl mb-8 text-left">
              <p className="text-xs font-mono text-white/55 mb-2">The details we have for you</p>
              <p className="font-bold">{invite.name}</p>
              <p className="text-sm text-white/65">{invite.email}</p>
              <p className="mt-2 text-xs text-white/50">
                Name or email changed? Write to hello@gdgsydney.com and we&rsquo;ll update them.
              </p>
            </div>

            <JoinForm token={token!} eventName={invite.event.name} phone={invite.phone} dietaryRequirements={invite.dietaryRequirements} />
          </>
        )}
      </div>
    </main>
  );
}
