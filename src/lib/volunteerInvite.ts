import { createHmac, timingSafeEqual } from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import { hasEventEnded, loadEvent, toGdgEvent } from '@/lib/events';
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

// Organisers are added to a crew directly (Add organiser on /admin/crew) and are never invited
// like volunteers, so anyone who is one is left out of both invite lists. An organiser is
// someone with an organiser signup at any event, or whose profile says so (`isOrganiser`,
// GDG-wide: someone who joined the team between events, with no event crew to be on yet).
export function isOrganiserProfile(profile: FirebaseFirestore.DocumentData | undefined): boolean {
  return profile?.isOrganiser === true;
}

function organiserProfileIds(signups: FirebaseFirestore.QueryDocumentSnapshot[]): Set<string> {
  return new Set(
    signups
      .map((signup) => signup.data())
      .filter((data) => data.isOrganiser === true && typeof data.profileId === 'string')
      .map((data) => data.profileId as string)
  );
}

// Someone who could be invited to an event: on the crew of an earlier one (accepted there),
// in the volunteer pool, not an organiser, and with no signup for this one yet. `invitedAt` is set once an invite has gone out.
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

  const organiserIds = organiserProfileIds(signups.docs);
  const candidateIds = [...pastEventsByProfile.keys()].filter((profileId) => !alreadyIn.has(profileId) && !organiserIds.has(profileId));
  if (candidateIds.length === 0) return [];
  const profiles = await adminDb.getAll(...candidateIds.map((id) => adminDb.collection('volunteerProfiles').doc(id)));

  return profiles
    // Only people who asked to stay on the list (inPool, see fetchVolunteerPool); anyone who
    // later used "Don't invite me again" is out of it.
    .filter(
      (profile) =>
        profile.exists && profile.data()?.inPool === true && !profile.data()?.inviteOptOut && !isOrganiserProfile(profile.data())
    )
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

// "Don't invite me again", the link at the foot of every invite. Signed over the profile alone
// with its own purpose prefix, so it can't be turned into an invite or a confirm token.
const OPT_OUT_PURPOSE = 'volunteer-opt-out:';

function optOutSignature(profileId: string): string {
  const secret = process.env.VOLUNTEER_CONFIRM_SECRET;
  if (!secret) throw new Error('VOLUNTEER_CONFIRM_SECRET is not set.');
  return createHmac('sha256', secret).update(`${OPT_OUT_PURPOSE}${profileId}`).digest('base64url');
}

export function volunteerOptOutUrl(profileId: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://devfest.gdgsydney.com';
  const token = `${Buffer.from(profileId).toString('base64url')}${TOKEN_SEPARATOR}${optOutSignature(profileId)}`;
  return `${siteUrl.replace(/\/$/, '')}/volunteer/unsubscribe?token=${token}`;
}

export function verifyVolunteerOptOutToken(token: string): string | null {
  const [encodedId, providedSignature] = token.split(TOKEN_SEPARATOR);
  if (!encodedId || !providedSignature) return null;
  const profileId = Buffer.from(encodedId, 'base64url').toString('utf8');
  if (!profileId) return null;
  const expected = Buffer.from(optOutSignature(profileId));
  const provided = Buffer.from(providedSignature);
  if (expected.length !== provided.length) return null;
  return timingSafeEqual(expected, provided) ? profileId : null;
}

// One person on /admin/volunteer-pool: everyone with a volunteer profile except organisers.
// The pool itself is the ones with `inPool`, set by an admin for people who said they'd like
// to hear about future events: it works like a mailing list, so nobody is on it by default.
// Only pool members can be invited. Per event: whether they signed up
// (and how that went) and when they were invited.
export interface VolunteerPoolMember {
  profileId: string;
  name: string;
  email: string;
  crewedEventNames: string[]; // events they were accepted onto the crew of
  signupStatusByEvent: Record<string, string>;
  invitedAtByEvent: Record<string, string>;
  inPool: boolean;
  optedOut: boolean;
}

export interface VolunteerPoolEvent {
  id: string;
  name: string;
  type: GdgEvent['type'];
  startAt: string;
}

// The pool, and the events it can be invited to (taking volunteers and not over yet,
// soonest first). Reads every profile and signup: a few hundred documents a year at most.
export async function fetchVolunteerPool(): Promise<{ members: VolunteerPoolMember[]; events: VolunteerPoolEvent[] }> {
  const [profiles, signups, eventDocs] = await Promise.all([
    adminDb.collection('volunteerProfiles').get(),
    adminDb.collection('volunteers').get(),
    adminDb.collection('events').get(),
  ]);
  const events = eventDocs.docs.map((doc) => toGdgEvent(doc.id, doc.data()));
  const eventNames = new Map(events.map((event) => [event.id, event.name]));

  const signupsByProfile = new Map<string, FirebaseFirestore.DocumentData[]>();
  for (const signup of signups.docs) {
    const profileId = signup.data().profileId;
    if (typeof profileId === 'string' && profileId) {
      signupsByProfile.set(profileId, [...(signupsByProfile.get(profileId) ?? []), signup.data()]);
    }
  }

  const organiserIds = organiserProfileIds(signups.docs);
  const members = profiles.docs
    .filter((profile) => !organiserIds.has(profile.id) && !isOrganiserProfile(profile.data()))
    .map((profile): VolunteerPoolMember => {
      const data = profile.data();
      const own = signupsByProfile.get(profile.id) ?? [];
      const invites = (data.volunteerInvites ?? {}) as Record<string, { sentAt?: FirebaseFirestore.Timestamp }>;
      return {
        profileId: profile.id,
        name: String(data.name ?? ''),
        email: String(data.email ?? ''),
        crewedEventNames: [...new Set(own.filter((signup) => signup.status === 'accepted').map((signup) => eventNames.get(signup.eventId) ?? String(signup.eventId)))],
        signupStatusByEvent: Object.fromEntries(own.map((signup) => [String(signup.eventId), String(signup.status ?? 'pending')])),
        invitedAtByEvent: Object.fromEntries(
          Object.entries(invites)
            .filter(([, invite]) => invite?.sentAt)
            .map(([eventId, invite]) => [eventId, invite.sentAt!.toDate().toISOString()])
        ),
        inPool: data.inPool === true,
        optedOut: data.inviteOptOut === true,
      };
    })
    .sort((first, second) => first.name.localeCompare(second.name));

  const openEvents = events
    .filter((event) => inviteClosedReason(event) === null)
    .sort((first, second) => first.startAt.localeCompare(second.startAt))
    .map((event) => ({ id: event.id, name: event.name, type: event.type, startAt: event.startAt }));

  return { members, events: openEvents };
}
