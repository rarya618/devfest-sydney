'use server';

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { normaliseProfileUrl, toSpeakerSlug } from '@/lib/speakers';
import { verifyAdminSession } from '@/lib/adminSession';
import type { ExperienceLevel, TalkFormat, Track } from '@/lib/types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TALK_FORMATS: TalkFormat[] = ['talk', 'lightning-talk', 'workshop'];
const TRACKS: Track[] = ['developer', 'builder', 'workshop', 'showcase'];
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

// Mirrors isValidSpeaker in firestore.rules. The Admin SDK bypasses the rules, so the
// same limits are enforced here to keep admin edits within what the rules describe.
function validateSpeakerFields(fields: SpeakerEditableFields): { error: string } | { values: SpeakerEditableFields } {
  const name = fields.name.trim();
  const email = fields.email.trim().toLowerCase();
  const talkTitle = fields.talkTitle.trim();
  const abstract = fields.abstract.trim();
  const bio = fields.bio.trim();
  const tagline = fields.tagline.trim();
  const photoUrl = fields.photoUrl.trim();

  if (!name || !email || !talkTitle || !abstract) {
    return { error: 'Name, email, talk title, and abstract can\'t be empty.' };
  }
  if (name.length > 100) return { error: 'Name is too long (max 100 characters).' };
  if (!EMAIL_PATTERN.test(email)) return { error: 'Please enter a valid email address.' };
  if (talkTitle.length > 150) return { error: 'Talk title is too long (max 150 characters).' };
  if (abstract.length > 2000) return { error: 'Abstract is too long (max 2000 characters).' };
  if (!TALK_FORMATS.includes(fields.format)) return { error: 'Please select a valid talk format.' };
  if (!TRACKS.includes(fields.track)) return { error: 'Please select a valid track.' };
  if (!EXPERIENCE_LEVELS.includes(fields.experienceLevel)) return { error: 'Please select a valid experience level.' };
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

  return {
    values: {
      name,
      email,
      talkTitle,
      abstract,
      format: fields.format,
      track: fields.track,
      experienceLevel: fields.experienceLevel,
      ...profileLinks,
      bio,
      tagline,
      photoUrl,
    },
  };
}

export async function updateSpeaker(speakerId: string, fields: SpeakerEditableFields): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const validated = validateSpeakerFields(fields);
  if ('error' in validated) return { error: validated.error };

  try {
    const speakerRef = adminDb.collection('speakers').doc(speakerId);
    const snapshot = await speakerRef.get();
    if (!snapshot.exists) return { error: 'Speaker not found.' };

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
    revalidatePath('/admin/speakers');
    revalidatePath('/');
    revalidatePath('/speakers');
    return {};
  } catch {
    return { error: 'Could not save this speaker. Please try again.' };
  }
}

// Takes the speaker off the lineup and puts the source proposal back to pending, the same
// as Undo on the submissions dashboard, so the two entry points can't disagree.
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
    const batch = adminDb.batch();
    batch.delete(speakerRef);
    if (submissionId) {
      const submissionRef = adminDb.collection('submissions').doc(submissionId);
      const submissionSnapshot = await submissionRef.get();
      if (submissionSnapshot.exists) batch.update(submissionRef, { status: 'pending' });
    }
    await batch.commit();
    await deleteManagedPhoto(snapshot.data()?.photoUrl as string | undefined);

    revalidatePath('/admin/speakers');
    revalidatePath('/admin');
    revalidatePath('/');
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
