'use server';

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { normaliseProfileUrl, toSpeakerSlug } from '@/lib/speakers';
import { verifyAdminSession } from '@/lib/adminSession';
import type { ExperienceLevel, TalkFormat, Track } from '@/lib/types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TALK_FORMATS: TalkFormat[] = ['talk', 'lightning-talk', 'workshop'];
const TRACKS: Track[] = ['keynote', 'spotlight', 'developer', 'builder', 'workshop', 'showcase'];
const EXPERIENCE_LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];

// Everything on a speaker document except submissionId and promotedAt, which record where
// the speaker came from and must not be edited.
export interface SpeakerEditableFields {
  name: string;
  email: string;
  talkTitle: string;
  abstract: string;
  format: TalkFormat;
  track: Track;
  experienceLevel: ExperienceLevel;
  linkedinUrl: string;
  githubUrl: string;
  websiteUrl: string;
  bio: string;
  tagline: string;
  photoUrl: string;
}

// The half of a speaker that is about the person. A co-speaker's document holds only this,
// since their session is read from the lead they present with.
export type SpeakerProfileFields = Pick<
  SpeakerEditableFields,
  'name' | 'email' | 'linkedinUrl' | 'githubUrl' | 'websiteUrl' | 'bio' | 'tagline' | 'photoUrl'
>;

function validateProfileFields(fields: SpeakerProfileFields): { error: string } | { values: SpeakerProfileFields } {
  const name = fields.name.trim();
  const email = fields.email.trim().toLowerCase();
  const bio = fields.bio.trim();
  const tagline = fields.tagline.trim();
  const photoUrl = fields.photoUrl.trim();

  if (!name || !email) return { error: 'Name and email can\'t be empty.' };
  if (name.length > 100) return { error: 'Name is too long (max 100 characters).' };
  if (!EMAIL_PATTERN.test(email)) return { error: 'Please enter a valid email address.' };
  if (bio.length > 1000) return { error: 'Bio is too long (max 1000 characters).' };
  if (tagline.length > 200) return { error: 'Tagline is too long (max 200 characters).' };
  if (photoUrl && (!photoUrl.startsWith('https://') || photoUrl.length > 500)) {
    return { error: 'Photo must be an https link, no longer than 500 characters.' };
  }

  // A scheme-less "linkedin.com/in/..." is accepted and given https://; anything that still
  // is not a web address is rejected rather than silently blanked, so the admin sees it.
  const profileLinks = {
    linkedinUrl: normaliseProfileUrl(fields.linkedinUrl),
    githubUrl: normaliseProfileUrl(fields.githubUrl),
    websiteUrl: normaliseProfileUrl(fields.websiteUrl),
  };
  if (fields.linkedinUrl.trim() && !profileLinks.linkedinUrl) return { error: 'The LinkedIn link isn\'t a valid web address.' };
  if (fields.githubUrl.trim() && !profileLinks.githubUrl) return { error: 'The GitHub link isn\'t a valid web address.' };
  if (fields.websiteUrl.trim() && !profileLinks.websiteUrl) return { error: 'The website link isn\'t a valid web address.' };
  if (Object.values(profileLinks).some((url) => url.length > 500)) {
    return { error: 'Profile links must be no longer than 500 characters.' };
  }

  return { values: { name, email, ...profileLinks, bio, tagline, photoUrl } };
}

// Mirrors isValidSpeaker in firestore.rules. The Admin SDK bypasses the rules, so the
// same limits are enforced here to keep admin edits within what the rules describe.
function validateSpeakerFields(fields: SpeakerEditableFields): { error: string } | { values: SpeakerEditableFields } {
  const profile = validateProfileFields(fields);
  if ('error' in profile) return profile;

  const talkTitle = fields.talkTitle.trim();
  const abstract = fields.abstract.trim();

  if (!talkTitle || !abstract) return { error: 'Talk title and abstract can\'t be empty.' };
  if (talkTitle.length > 150) return { error: 'Talk title is too long (max 150 characters).' };
  if (abstract.length > 2000) return { error: 'Abstract is too long (max 2000 characters).' };
  if (!TALK_FORMATS.includes(fields.format)) return { error: 'Please select a valid talk format.' };
  if (!TRACKS.includes(fields.track)) return { error: 'Please select a valid track.' };
  if (!EXPERIENCE_LEVELS.includes(fields.experienceLevel)) return { error: 'Please select a valid experience level.' };

  return {
    values: {
      ...profile.values,
      talkTitle,
      abstract,
      format: fields.format,
      track: fields.track,
      experienceLevel: fields.experienceLevel,
    },
  };
}

// Adds someone presenting a speaker's session with them. Only the profile is stored: the
// talk, track and confirmation stay on the lead, so the session can't drift apart between
// the two. A co-speaker can't have co-speakers of their own; they are added to the lead.
export async function addCoSpeaker(leadSpeakerId: string, fields: SpeakerProfileFields): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const validated = validateProfileFields(fields);
  if ('error' in validated) return { error: validated.error };

  try {
    const leadSnapshot = await adminDb.collection('speakers').doc(leadSpeakerId).get();
    if (!leadSnapshot.exists) return { error: 'The speaker you\'re adding a co-speaker to is no longer in the lineup.' };
    if (leadSnapshot.data()?.coSpeakerOf) {
      return { error: 'This person is already a co-speaker. Add the new co-speaker from the lead speaker\'s card instead.' };
    }

    await adminDb.collection('speakers').add({
      ...validated.values,
      coSpeakerOf: leadSpeakerId,
      previousSlugs: [],
      promotedAt: FieldValue.serverTimestamp(),
    });
    revalidateLineup();
    return {};
  } catch {
    return { error: 'Could not add this co-speaker. Please try again.' };
  }
}

function revalidateLineup() {
  revalidatePath('/admin/speakers');
  revalidatePath('/');
  revalidatePath('/speakers');
  revalidatePath('/schedule');
}

export async function updateSpeaker(speakerId: string, fields: SpeakerEditableFields): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    const speakerRef = adminDb.collection('speakers').doc(speakerId);
    const snapshot = await speakerRef.get();
    if (!snapshot.exists) return { error: 'Speaker not found.' };

    // A co-speaker's session is the lead's, so only their profile is written. The talk
    // fields the modal sends back are the lead's copies and are ignored.
    const isCoSpeaker = Boolean(snapshot.data()?.coSpeakerOf);
    const validated = isCoSpeaker ? validateProfileFields(fields) : validateSpeakerFields(fields);
    if ('error' in validated) return { error: validated.error };

    // Slugs are derived from the name, so a rename moves the public page. The slug the page
    // was at is remembered so /speakers/<old> can redirect; if the name goes back, the slug
    // is live again and comes out of the history so a live slug is never also a redirect.
    const existing = snapshot.data() ?? {};
    const previousSlug = toSpeakerSlug((existing.name as string | undefined) ?? '');
    const nextSlug = toSpeakerSlug(validated.values.name);
    const storedSlugs: string[] = Array.isArray(existing.previousSlugs) ? existing.previousSlugs : [];
    const previousSlugs =
      previousSlug === nextSlug
        ? storedSlugs
        : Array.from(new Set([...storedSlugs, previousSlug])).filter((slug) => slug !== nextSlug);

    await speakerRef.update({ ...validated.values, previousSlugs });
    revalidateLineup();
    return {};
  } catch {
    return { error: 'Could not save this speaker. Please try again.' };
  }
}

// Takes the speaker off the lineup and puts the source proposal back to pending, the same
// as Undo on the submissions dashboard, so the two entry points can't disagree. Their
// co-speakers go with them, since the session they shared is gone. A co-speaker on their
// own has no proposal, so removing one only deletes them.
export async function removeSpeaker(speakerId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    const speakerRef = adminDb.collection('speakers').doc(speakerId);
    const snapshot = await speakerRef.get();
    if (!snapshot.exists) return { error: 'Speaker not found.' };

    const submissionId = snapshot.data()?.submissionId as string | undefined;
    const coSpeakers = await adminDb.collection('speakers').where('coSpeakerOf', '==', speakerId).get();
    const batch = adminDb.batch();
    batch.delete(speakerRef);
    coSpeakers.docs.forEach((coSpeaker) => batch.delete(coSpeaker.ref));
    if (submissionId) {
      const submissionRef = adminDb.collection('submissions').doc(submissionId);
      const submissionSnapshot = await submissionRef.get();
      if (submissionSnapshot.exists) batch.update(submissionRef, { status: 'pending' });
    }
    await batch.commit();
    await deleteManagedPhoto(snapshot.data()?.photoUrl as string | undefined);
    for (const coSpeaker of coSpeakers.docs) await deleteManagedPhoto(coSpeaker.data().photoUrl as string | undefined);

    revalidateLineup();
    revalidatePath('/admin');
    return {};
  } catch {
    return { error: 'Could not remove this speaker. Please try again.' };
  }
}

const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

// Stores the photo under speaker-photos/<speakerId>/ with a fresh name each time, so a
// replacement never collides with a cached copy of the old one. The public URL is on
// storage.googleapis.com, the same host the site's other assets use and one that
// next.config.ts already allows for next/image.
export async function uploadSpeakerPhoto(speakerId: string, formData: FormData): Promise<{ error?: string; photoUrl?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const photo = formData.get('photo');
  if (!(photo instanceof File) || photo.size === 0) {
    return { error: 'Please choose a photo to upload.' };
  }
  const extension = PHOTO_EXTENSIONS[photo.type];
  if (!extension) {
    return { error: 'Photos must be a JPEG, PNG, or WebP image.' };
  }
  if (photo.size > PHOTO_MAX_BYTES) {
    return { error: 'That photo is too large. Please keep it under 5 MB.' };
  }

  try {
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

    const previousPhotoUrl = snapshot.data()?.photoUrl as string | undefined;
    await deleteManagedPhoto(previousPhotoUrl);

    revalidatePath('/admin/speakers');
    revalidatePath('/');
    return { photoUrl };
  } catch {
    return { error: 'Could not upload this photo. Please try again.' };
  }
}

export async function removeSpeakerPhoto(speakerId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    const speakerRef = adminDb.collection('speakers').doc(speakerId);
    const snapshot = await speakerRef.get();
    if (!snapshot.exists) return { error: 'Speaker not found.' };

    await speakerRef.update({ photoUrl: '' });
    await deleteManagedPhoto(snapshot.data()?.photoUrl as string | undefined);

    revalidatePath('/admin/speakers');
    revalidatePath('/');
    return {};
  } catch {
    return { error: 'Could not remove this photo. Please try again.' };
  }
}

// Only deletes objects this page uploaded (under speaker-photos/). A photoUrl pasted by
// hand could point at any shared asset, and those are left alone. Deletion failures are
// swallowed: an orphaned file in the bucket is far cheaper than a failed replacement.
async function deleteManagedPhoto(photoUrl: string | undefined): Promise<void> {
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
