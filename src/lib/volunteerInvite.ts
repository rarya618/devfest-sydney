import { createHmac, timingSafeEqual } from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import { hasEventEnded, loadEvent } from '@/lib/events';
import { withProfile } from '@/lib/volunteerProfiles';
import type { GdgEvent } from '@/lib/types';

// "Invite past volunteers", stage 4d-2 of the plan in PM.md. Someone who has crewed before is
// emailed a link to /volunteer/join, which shows the details we already hold and asks only
// what this event needs (where they'd like to help, and anything to add), so they never fill
// the whole form in again. As with /volunteer/confirm there is no session: the link carries
// the profile and the event, plus an HMAC of both.
//
// Signed with VOLUNTEER_CONFIRM_SECRET over a purpose prefix, so an invite token can never
// pass as a confirm token or the reverse, and there is no new secret to create.
const TOKEN_SEPARATOR = '.';
const TOKEN_PURPOSE = 'volunteer-invite:';

function signature(profileId: string, eventId: string): string {
  const secret = process.env.VOLUNTEER_CONFIRM_SECRET;
  if (!secret) throw new Error('VOLUNTEER_CONFIRM_SECRET is not set.');
  return createHmac('sha256', secret).update(`${TOKEN_PURPOSE}${profileId}:${eventId}`).digest('base64url');
}

export function createVolunteerInviteToken(profileId: string, eventId: string): string {
  const payload = Buffer.from(`${profileId}:${eventId}`).toString('base64url');
  return `${payload}${TOKEN_SEPARATOR}${signature(profileId, eventId)}`;
}

// The profile and event an invite was issued for, or null if the token is malformed or not ours.
export function verifyVolunteerInviteToken(token: string): { profileId: string; eventId: string } | null {
  const [payload, providedSignature] = token.split(TOKEN_SEPARATOR);
  if (!payload || !providedSignature) return null;
  const [profileId, eventId] = Buffer.from(payload, 'base64url').toString('utf8').split(':');
  if (!profileId || !eventId) return null;

  const expected = Buffer.from(signature(profileId, eventId));
  const provided = Buffer.from(providedSignature);
  if (expected.length !== provided.length) return null;
  return timingSafeEqual(expected, provided) ? { profileId, eventId } : null;
}

export function volunteerInviteUrl(profileId: string, eventId: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://devfest.gdgsydney.com';
  return `${siteUrl.replace(/\/$/, '')}/volunteer/join?token=${createVolunteerInviteToken(profileId, eventId)}`;
}

// Why an event can't take an invited volunteer right now, or null if it can. Invites work
// before the public form opens (that is the point of asking past crew first), so this asks
// only that the event has volunteers at all and hasn't happened yet.
export function inviteClosedReason(event: GdgEvent | null): string | null {
  if (!event) return 'This event no longer exists.';
  if (!event.volunteers.enabled) return `${event.name} isn't taking volunteers.`;
  if (hasEventEnded(event)) return `${event.name} has already happened.`;
  return null;
}

export interface VolunteerInvite {
  profileId: string;
  event: GdgEvent;
  name: string;
  email: string;
  phone: string;
  dietaryRequirements: string;
  // Set once they have answered (or signed up through the public form): the invite then
  // shows "you're signed up" instead of asking again.
  alreadySignedUp: boolean;
  closedReason: string | null;
}

// What /volunteer/join shows for a token. Null for a bad token or a profile that is gone.
export async function loadVolunteerInvite(token: string): Promise<VolunteerInvite | null> {
  const verified = verifyVolunteerInviteToken(token);
  if (!verified) return null;

  const [profileSnapshot, event, existing] = await Promise.all([
    adminDb.collection('volunteerProfiles').doc(verified.profileId).get(),
    loadEvent(verified.eventId),
    adminDb
      .collection('volunteers')
      .where('profileId', '==', verified.profileId)
      .where('eventId', '==', verified.eventId)
      .limit(1)
      .get(),
  ]);
  if (!profileSnapshot.exists || !event) return null;
  const profile = withProfile({}, profileSnapshot.data());

  return {
    profileId: verified.profileId,
    event,
    name: String(profile.name ?? ''),
    email: String(profile.email ?? ''),
    phone: String(profile.phone ?? ''),
    dietaryRequirements: String(profile.dietaryRequirements ?? ''),
    alreadySignedUp: !existing.empty,
    closedReason: inviteClosedReason(event),
  };
}

// Someone who could be invited to an event: on the crew of an earlier one (accepted there),
// and with no signup for this one yet. `invitedAt` is set once an invite has gone out.
export interface InvitablePastVolunteer {
  profileId: string;
  name: string;
  email: string;
  pastEventNames: string[];
  invitedAt: string | null;
}

// For the "Invite past volunteers" list on /admin/crew. Reads every signup: a few hundred
// documents a year at most.
export async function fetchInvitablePastVolunteers(eventId: string): Promise<InvitablePastVolunteer[]> {
  if (!eventId) return [];
  const [signups, events] = await Promise.all([
    adminDb.collection('volunteers').get(),
    adminDb.collection('events').get(),
  ]);
  const eventNames = new Map(events.docs.map((doc) => [doc.id, String(doc.data().name ?? doc.id)]));

  const alreadyIn = new Set<string>();
  const pastEventsByProfile = new Map<string, Set<string>>();
  for (const signup of signups.docs) {
    const data = signup.data();
    const profileId = typeof data.profileId === 'string' ? data.profileId : '';
    if (!profileId) continue;
    if (data.eventId === eventId) alreadyIn.add(profileId);
    else if (data.status === 'accepted') {
      pastEventsByProfile.set(profileId, (pastEventsByProfile.get(profileId) ?? new Set()).add(String(data.eventId ?? '')));
    }
  }

  const candidateIds = [...pastEventsByProfile.keys()].filter((profileId) => !alreadyIn.has(profileId));
  if (candidateIds.length === 0) return [];
  const profiles = await adminDb.getAll(...candidateIds.map((id) => adminDb.collection('volunteerProfiles').doc(id)));

  return profiles
    .filter((profile) => profile.exists)
    .map((profile) => {
      const data = profile.data()!;
      const sentAt = data.volunteerInvites?.[eventId]?.sentAt as FirebaseFirestore.Timestamp | undefined;
      return {
        profileId: profile.id,
        name: String(data.name ?? ''),
        email: String(data.email ?? ''),
        pastEventNames: [...(pastEventsByProfile.get(profile.id) ?? [])].map((id) => eventNames.get(id) ?? id),
        invitedAt: sentAt ? sentAt.toDate().toISOString() : null,
      };
    })
    .sort((first, second) => first.name.localeCompare(second.name));
}
