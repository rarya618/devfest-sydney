import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';

// GDG-wide volunteers, stage 4d of the plan in PM.md. A `volunteerProfiles` document is the
// person: who they are and how to reach them, kept across every event they help at. A
// `volunteers` document stays what it was, one person's signup for one event, with that
// event's answers (motivation, areas of interest), review, roster, confirmation and ticket,
// and now a `profileId` pointing at the person. Ids of `volunteers` documents never change,
// since /volunteer/confirm tokens are signed over them. Server only.

// What belongs to the person rather than to one event's signup.
export const VOLUNTEER_PROFILE_KEYS = [
  'name',
  'email',
  'phone',
  'priorExperience',
  'googleTechExperience',
  'isTorrensStudentOrStaff',
  'hasBeenGdgOnCampusExec',
  'gdgOnCampusChapter',
  'dietaryRequirements',
  'photoUrl',
  'linkedinUrl',
] as const;

export type VolunteerProfileKey = (typeof VOLUNTEER_PROFILE_KEYS)[number];
export type VolunteerProfileFields = Record<VolunteerProfileKey, string | boolean>;

export const EMPTY_VOLUNTEER_PROFILE: VolunteerProfileFields = {
  name: '',
  email: '',
  phone: '',
  priorExperience: '',
  googleTechExperience: '',
  isTorrensStudentOrStaff: false,
  hasBeenGdgOnCampusExec: false,
  gdgOnCampusChapter: '',
  dietaryRequirements: '',
  photoUrl: '',
  linkedinUrl: '',
};

function sameName(first: unknown, second: unknown): boolean {
  return String(first ?? '').trim().toLowerCase() === String(second ?? '').trim().toLowerCase();
}

// The profile a new signup or organiser belongs to. Reused only when both the email and the
// name match (as for speakers in 4c: an address alone doesn't identify someone). A reused
// profile takes the newer answers for every field given here, since a fresh signup is the
// person's latest phone number or dietary needs; fields not given (an organiser's photo, say)
// are left as they are.
export async function findOrCreateVolunteerProfile(fields: Partial<VolunteerProfileFields> & { name: string; email: string }): Promise<string> {
  const emailNormalised = fields.email.trim().toLowerCase();
  const sameEmail = await adminDb.collection('volunteerProfiles').where('emailNormalised', '==', emailNormalised).get();
  const match = sameEmail.docs.find((doc) => sameName(doc.data().name, fields.name));

  if (match) {
    await match.ref.update({ ...fields, emailNormalised, updatedAt: FieldValue.serverTimestamp() });
    return match.id;
  }
  const created = await adminDb.collection('volunteerProfiles').add({
    ...EMPTY_VOLUNTEER_PROFILE,
    ...fields,
    emailNormalised,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return created.id;
}

// The signup with its person's fields laid over it. Since the 4d cleanup pass
// (scripts/cleanup-volunteer-fields.mjs) a signup holds none of them itself, so the profile
// is the only source; a missing profile reads as blank details.
export function withProfile(
  signup: FirebaseFirestore.DocumentData,
  profile: FirebaseFirestore.DocumentData | undefined
): FirebaseFirestore.DocumentData {
  const merged: FirebaseFirestore.DocumentData = { ...signup };
  for (const key of VOLUNTEER_PROFILE_KEYS) {
    if (profile?.[key] !== undefined) merged[key] = profile[key];
  }
  return merged;
}

export interface VolunteerRecord {
  ref: FirebaseFirestore.DocumentReference;
  profileRef: FirebaseFirestore.DocumentReference;
  // The signup with the person's current details merged in.
  data: FirebaseFirestore.DocumentData;
}

// One signup, joined to its profile, for the actions and confirm pages that read a
// volunteer's name or address. Null when the signup, or the profile it points at, doesn't
// exist: without the profile there is no name or address to work with.
export async function loadVolunteerRecord(volunteerId: string): Promise<VolunteerRecord | null> {
  const ref = adminDb.collection('volunteers').doc(volunteerId);
  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  const signup = snapshot.data()!;
  const profileId = typeof signup.profileId === 'string' ? signup.profileId : '';
  if (!profileId) return null;
  const profileRef = adminDb.collection('volunteerProfiles').doc(profileId);
  const profile = (await profileRef.get()).data();
  if (!profile) return null;
  return { ref, profileRef, data: withProfile(signup, profile) };
}

// Every profile the given signups point at, by id, in one read.
export async function loadProfilesFor(signups: FirebaseFirestore.DocumentData[]): Promise<Map<string, FirebaseFirestore.DocumentData>> {
  const profileIds = [...new Set(signups.map((signup) => signup.profileId).filter((id): id is string => typeof id === 'string' && id !== ''))];
  if (profileIds.length === 0) return new Map();
  const snapshots = await adminDb.getAll(...profileIds.map((id) => adminDb.collection('volunteerProfiles').doc(id)));
  return new Map(snapshots.filter((snapshot) => snapshot.exists).map((snapshot) => [snapshot.id, snapshot.data()!]));
}

// After a signup is deleted (an organiser removed from the crew): the profile goes too if no
// other signup, at any event, still points at it. Returns the photo it had, for the caller
// to delete from Storage.
export async function removeVolunteerProfileIfUnused(profileId: string): Promise<string | undefined> {
  if (!profileId) return undefined;
  const stillUsed = await adminDb.collection('volunteers').where('profileId', '==', profileId).limit(1).get();
  if (!stillUsed.empty) return undefined;
  const profileRef = adminDb.collection('volunteerProfiles').doc(profileId);
  const profile = await profileRef.get();
  if (!profile.exists) return undefined;
  await profileRef.delete();
  return profile.data()?.photoUrl as string | undefined;
}
