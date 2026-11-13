import { SITE_OG_IMAGE } from '@/lib/metadata';
import { getVerifiedSession } from '@/lib/adminSession';
import { fetchCrew } from '@/lib/volunteers';
import CrewDashboard from '../../CrewDashboard';
import { getAdminDevfestContext } from '@/lib/adminEvent';
import { fetchInvitablePastVolunteers, inviteClosedReason } from '@/lib/volunteerInvite';

export const metadata = {
  title: 'Crew',
  openGraph: { title: 'Crew — DevFest Sydney 2026', images: [SITE_OG_IMAGE] },
  twitter: { card: 'summary_large_image', title: 'Crew — DevFest Sydney 2026', images: [SITE_OG_IMAGE] },
};

export default async function CrewPage() {
  const { selectedDevfest } = await getAdminDevfestContext();
  const eventId = selectedDevfest?.id ?? '';
  const [, crew, invitable] = await Promise.all([
    getVerifiedSession(),
    fetchCrew(eventId),
    // Null when the list can't be read, so the invite button hides rather than claiming
    // there is nobody to ask.
    fetchInvitablePastVolunteers(eventId).catch(() => null),
  ]);

  return (
    <CrewDashboard
      crew={crew}
      invites={{
        eventId,
        eventName: selectedDevfest?.name ?? '',
        people: invitable,
        closedReason: inviteClosedReason(selectedDevfest),
      }}
    />
  );
}
