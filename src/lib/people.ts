import { randomUUID } from 'node:crypto';
import { FieldValue, type Timestamp } from 'firebase-admin/firestore';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { normaliseProfileUrl } from '@/lib/speakers';

// GDG-wide speakers, stage 4c of the plan in PM.md. A `speakers` document is the person: their
// profile, kept across every talk they give, at any event. Their talks are `talks` documents
// listing them in speakerIds. Server only.

export interface PersonProfile {
  name: string;
  email: string;
  linkedinUrl: string;
  githubUrl: string;
  websiteUrl: string;
  bio: string;
  tagline: string;
  photoUrl: string;
}

function sameName(first: unknown, second: string): boolean {
  return String(first ?? '').trim().toLowerCase() === second.trim().toLowerCase();
}

// The person a new talk belongs to. An existing person is reused only when both the email
// and the name match: an address alone doesn't identify someone, since co-presenters are
// sometimes entered under the lead's (as Yuting Mao was for Qasim Tariq's 2026 talk), and a
// name alone is never unique. Otherwise a new person is created. A reused person keeps their
// profile; only the parts they don't have yet are filled from the new one, so a newer
// proposal never silently overwrites a bio an organiser has edited.
export async function findOrCreatePerson(profile: PersonProfile): Promise<string> {
  const emailNormalised = profile.email.trim().toLowerCase();
  const sameEmail = await adminDb.collection('speakers').where('emailNormalised', '==', emailNormalised).get();
  const match = sameEmail.docs.find((doc) => sameName(doc.data().name, profile.name));

  if (match) {
    const existing = match.data();
    const fillIns: Record<string, string> = {};
    for (const key of ['linkedinUrl', 'githubUrl', 'websiteUrl', 'bio', 'tagline', 'photoUrl'] as const) {
      if (!existing[key] && profile[key]) fillIns[key] = profile[key];
    }
    if (Object.keys(fillIns).length > 0) await match.ref.update(fillIns);
    return match.id;
  }

  const created = await adminDb.collection('speakers').add({
    name: profile.name.trim(),
    email: profile.email.trim(),
    emailNormalised,
    linkedinUrl: normaliseProfileUrl(profile.linkedinUrl),
    githubUrl: normaliseProfileUrl(profile.githubUrl),
    websiteUrl: normaliseProfileUrl(profile.websiteUrl),
    bio: profile.bio,
    tagline: profile.tagline,
    photoUrl: profile.photoUrl,
    previousSlugs: [],
    createdAt: FieldValue.serverTimestamp(),
  });
  return created.id;
}

// After a talk is removed or someone is taken off one: anyone in `speakerIds` who no longer
// gives any talk is deleted, with the photo this app uploaded for them. Someone with a talk
// at another event, or another talk at this one, is kept. A person with a thank-you answer
// in speakerGifts is kept too, since /privacy covers deleting those separately.
export async function removePeopleWithoutTalks(speakerIds: string[]): Promise<void> {
  for (const speakerId of new Set(speakerIds)) {
    const [stillPresenting, gift] = await Promise.all([
      adminDb.collection('talks').where('speakerIds', 'array-contains', speakerId).limit(1).get(),
      adminDb.collection('speakerGifts').doc(speakerId).get(),
    ]);
    if (!stillPresenting.empty || gift.exists) continue;
    const personRef = adminDb.collection('speakers').doc(speakerId);
    const person = await personRef.get();
    if (!person.exists) continue;
    await personRef.delete();
    await deleteManagedPhoto(person.data()?.photoUrl as string | undefined);
  }
}

// Only deletes objects this app uploaded (under speaker-photos/). A photoUrl pasted by hand
// could point at any shared asset, and those are left alone. Deletion failures are
// swallowed: an orphaned file in the bucket is far cheaper than a failed replacement.
export async function deleteManagedPhoto(photoUrl: string | undefined): Promise<void> {
  if (!photoUrl) return;
  const bucket = adminStorage.bucket();
  const prefix = `https://storage.googleapis.com/${bucket.name}/speaker-photos/`;
  if (!photoUrl.startsWith(prefix)) return;
  const objectPath = decodeURIComponent(photoUrl.slice(`https://storage.googleapis.com/${bucket.name}/`.length));
  try {
    await bucket.file(objectPath).delete({ ignoreNotFound: true });
  } catch {
    // Orphaned object; nothing the admin can act on.
  }
}

export const SPEAKER_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const SPEAKER_PHOTO_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

// Stores a person's photo under speaker-photos/<speakerId>/ with a fresh name each time, so a
// replacement never collides with a cached copy of the old one, then deletes the old one. The
// public URL is on storage.googleapis.com, which next.config.ts allows for next/image. Shared
// by the admin and the speaker portal; the caller checks who may change this person. Errors
// come back as plain sentences for the person who chose the file.
export async function replaceSpeakerPhoto(speakerId: string, photo: unknown): Promise<{ error: string } | { photoUrl: string }> {
  if (!(photo instanceof File) || photo.size === 0) return { error: 'Please choose a photo to upload.' };
  const extension = SPEAKER_PHOTO_EXTENSIONS[photo.type];
  if (!extension) return { error: 'Photos must be a JPEG, PNG, or WebP image.' };
  if (photo.size > SPEAKER_PHOTO_MAX_BYTES) return { error: 'That photo is too large. Please keep it under 5 MB.' };

  const speakerRef = adminDb.collection('speakers').doc(speakerId);
  const snapshot = await speakerRef.get();
  if (!snapshot.exists) return { error: 'Speaker not found.' };

  const bucket = adminStorage.bucket();
  const objectPath = `speaker-photos/${speakerId}/${randomUUID()}.${extension}`;
  const file = bucket.file(objectPath);
  await file.save(Buffer.from(await photo.arrayBuffer()), {
    contentType: photo.type,
    metadata: { cacheControl: 'public, max-age=31536000, immutable' },
  });
  await file.makePublic();

  const photoUrl = `https://storage.googleapis.com/${bucket.name}/${objectPath}`;
  await speakerRef.update({ photoUrl });
  await deleteManagedPhoto(snapshot.data()?.photoUrl as string | undefined);
  return { photoUrl };
}

export async function clearSpeakerPhoto(speakerId: string): Promise<{ error: string } | null> {
  const speakerRef = adminDb.collection('speakers').doc(speakerId);
  const snapshot = await speakerRef.get();
  if (!snapshot.exists) return { error: 'Speaker not found.' };
  await speakerRef.update({ photoUrl: '' });
  await deleteManagedPhoto(snapshot.data()?.photoUrl as string | undefined);
  return null;
}

// One row of /admin/people: the person and every talk they have given or are giving.
export interface PersonWithTalks extends PersonProfile {
  id: string;
  createdAt: string | null;
  talks: { talkId: string; eventId: string; eventName: string; talkTitle: string; isLead: boolean; startAt: string | null }[];
}

// Everyone in `speakers`, with their talks joined from `talks` and named by event, newest
// event first. Small enough (a few dozen people a year) to read whole.
export async function fetchPeople(): Promise<PersonWithTalks[]> {
  const [peopleSnapshot, talksSnapshot, eventsSnapshot] = await Promise.all([
    adminDb.collection('speakers').get(),
    adminDb.collection('talks').get(),
    adminDb.collection('events').get(),
  ]);
  const eventsById = new Map(eventsSnapshot.docs.map((doc) => [doc.id, doc.data()]));

  return peopleSnapshot.docs
    .map((doc) => {
      const person = doc.data();
      const talks = talksSnapshot.docs
        .filter((talk) => ((talk.data().speakerIds ?? []) as string[]).includes(doc.id))
        .map((talk) => {
          const talkData = talk.data();
          const event = eventsById.get(String(talkData.eventId ?? ''));
          const startAt = event?.startAt as Timestamp | undefined;
          return {
            talkId: talk.id,
            eventId: String(talkData.eventId ?? ''),
            eventName: String(event?.name ?? talkData.eventId ?? 'Unknown event'),
            talkTitle: String(talkData.talkTitle ?? ''),
            isLead: ((talkData.speakerIds ?? []) as string[])[0] === doc.id,
            startAt: startAt ? startAt.toDate().toISOString() : null,
          };
        })
        .sort((first, second) => String(second.startAt).localeCompare(String(first.startAt)));
      const createdAt = person.createdAt as Timestamp | undefined;
      return {
        id: doc.id,
        name: person.name ?? '',
        email: person.email ?? '',
        linkedinUrl: normaliseProfileUrl(person.linkedinUrl ?? ''),
        githubUrl: normaliseProfileUrl(person.githubUrl ?? ''),
        websiteUrl: normaliseProfileUrl(person.websiteUrl ?? ''),
        bio: person.bio ?? '',
        tagline: person.tagline ?? '',
        photoUrl: person.photoUrl ?? '',
        createdAt: createdAt ? createdAt.toDate().toISOString() : null,
        talks,
      };
    })
    .sort((first, second) => first.name.localeCompare(second.name));
}
