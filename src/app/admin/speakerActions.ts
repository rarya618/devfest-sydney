'use server';

import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { normaliseProfileUrl, toSpeakerSlug } from '@/lib/speakers';
import { clearSpeakerPhoto, findOrCreatePerson, removePeopleWithoutTalks, replaceSpeakerPhoto } from '@/lib/people';
import { verifyAdminSession } from '@/lib/adminSession';
import type { ExperienceLevel, TalkFormat, Track } from '@/lib/types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TALK_FORMATS: TalkFormat[] = ['talk', 'lightning-talk', 'workshop'];
const TRACKS: Track[] = ['keynote', 'spotlight', 'developer', 'builder', 'workshop', 'showcase'];
const EXPERIENCE_LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];

// What the edit modal offers on a speaker row: the person (saved to `speakers`) and, from
// the lead's row only, the talk (saved to `talks`).
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

// The half of a speaker that is about the person: all a `speakers` document holds.
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

// The talk half of a speaker's fields, split out so a co-speaker's edit can't touch it.
type TalkFields = Pick<SpeakerEditableFields, 'talkTitle' | 'abstract' | 'format' | 'track' | 'experienceLevel'>;

function talkFieldsOf(values: SpeakerEditableFields): TalkFields {
  const { talkTitle, abstract, format, track, experienceLevel } = values;
  return { talkTitle, abstract, format, track, experienceLevel };
}

function profileFieldsOf(values: SpeakerProfileFields): SpeakerProfileFields {
  const { name, email, linkedinUrl, githubUrl, websiteUrl, bio, tagline, photoUrl } = values;
  return { name, email, linkedinUrl, githubUrl, websiteUrl, bio, tagline, photoUrl };
}

// Adds someone presenting a talk with its lead. Since stage 4c a co-speaker is a person
// (`speakers`) listed second or later on the talk's speakerIds; the talk, track and
// confirmation are the talk's, so the session lives in one place. An existing person with
// the same email AND name is reused rather than duplicated (see findOrCreatePerson).
export async function addCoSpeaker(talkId: string, fields: SpeakerProfileFields): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const validated = validateProfileFields(fields);
  if ('error' in validated) return { error: validated.error };

  try {
    const talkRef = adminDb.collection('talks').doc(talkId);
    const talkSnapshot = await talkRef.get();
    if (!talkSnapshot.exists) return { error: 'The talk you\'re adding a co-speaker to is no longer in the lineup.' };

    const personId = await findOrCreatePerson(validated.values);
    const speakerIds = (talkSnapshot.data()?.speakerIds ?? []) as string[];
    if (speakerIds.includes(personId)) return { error: 'This person is already presenting this talk.' };

    await talkRef.update({ speakerIds: FieldValue.arrayUnion(personId) });
    revalidateLineup();
    return {};
  } catch {
    return { error: 'Could not add this co-speaker. Please try again.' };
  }
}

function revalidateLineup() {
  revalidatePath('/admin/devfest/speakers');
  revalidatePath('/admin/people');
}

// Saves a row from /admin/devfest/speakers. The profile goes to the person, so it changes on every
// talk they give; the talk fields go to the talk, and only from its lead's row: on a
// co-speaker the modal sends the talk's own values back, and they are ignored.
export async function updateSpeaker(talkId: string, speakerId: string, fields: SpeakerEditableFields): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    const talkSnapshot = await adminDb.collection('talks').doc(talkId).get();
    if (!talkSnapshot.exists) return { error: 'This talk is no longer in the lineup.' };
    const isLead = ((talkSnapshot.data()?.speakerIds ?? []) as string[])[0] === speakerId;

    const validated = isLead ? validateSpeakerFields(fields) : validateProfileFields(fields);
    if ('error' in validated) return { error: validated.error };

    const profileError = await saveProfile(speakerId, validated.values);
    if (profileError) return profileError;
    if (isLead) {
      const talkFields = talkFieldsOf(validated.values as SpeakerEditableFields);
      const batch = adminDb.batch();
      batch.update(talkSnapshot.ref, { ...talkFields });
      // The title and abstract also go to the proposal behind it, which the speaker portal's
      // edit form and the proposals page read. Track, format and level stay the talk's alone:
      // a talk can be on a track (Spotlight, Keynote) nobody can propose into.
      const submissionId = String(talkSnapshot.data()?.submissionId ?? '');
      if (submissionId) {
        const submissionRef = adminDb.collection('submissions').doc(submissionId);
        if ((await submissionRef.get()).exists) batch.update(submissionRef, { talkTitle: talkFields.talkTitle, abstract: talkFields.abstract });
      }
      await batch.commit();
    }

    revalidateLineup();
    return {};
  } catch {
    return { error: 'Could not save this speaker. Please try again.' };
  }
}

// The person's half of a save, shared with /admin/people.
export async function updateSpeakerProfile(speakerId: string, fields: SpeakerProfileFields): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const validated = validateProfileFields(fields);
  if ('error' in validated) return { error: validated.error };

  try {
    const profileError = await saveProfile(speakerId, validated.values);
    if (profileError) return profileError;
    revalidateLineup();
    return {};
  } catch {
    return { error: 'Could not save this speaker. Please try again.' };
  }
}

async function saveProfile(speakerId: string, values: SpeakerProfileFields): Promise<{ error: string } | null> {
  const speakerRef = adminDb.collection('speakers').doc(speakerId);
  const snapshot = await speakerRef.get();
  if (!snapshot.exists) return { error: 'Speaker not found.' };

  // Slugs are derived from the name, so a rename moves the public page. The slug the page
  // was at is remembered so /speakers/<old> can redirect; if the name goes back, the slug
  // is live again and comes out of the history so a live slug is never also a redirect.
  const existing = snapshot.data() ?? {};
  const previousSlug = toSpeakerSlug((existing.name as string | undefined) ?? '');
  const nextSlug = toSpeakerSlug(values.name);
  const storedSlugs: string[] = Array.isArray(existing.previousSlugs) ? existing.previousSlugs : [];
  const previousSlugs =
    previousSlug === nextSlug
      ? storedSlugs
      : Array.from(new Set([...storedSlugs, previousSlug])).filter((slug) => slug !== nextSlug);

  await speakerRef.update({ ...profileFieldsOf(values), emailNormalised: values.email.toLowerCase(), previousSlugs });
  return null;
}

// Takes someone off a talk. Removing the lead removes the talk and puts its proposal back to
// pending, the same as Undo on the submissions dashboard, so the two can't disagree; its
// co-speakers go with it. Removing a co-speaker only takes them off the talk. Either way, a
// person left with no talks at all is deleted (see removePeopleWithoutTalks).
export async function removeSpeaker(talkId: string, speakerId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    const talkRef = adminDb.collection('talks').doc(talkId);
    const talkSnapshot = await talkRef.get();
    if (!talkSnapshot.exists) return { error: 'This talk is no longer in the lineup.' };
    const speakerIds = (talkSnapshot.data()?.speakerIds ?? []) as string[];

    if (speakerIds[0] === speakerId) {
      const submissionId = talkSnapshot.data()?.submissionId as string | undefined;
      const batch = adminDb.batch();
      batch.delete(talkRef);
      if (submissionId) {
        const submissionRef = adminDb.collection('submissions').doc(submissionId);
        if ((await submissionRef.get()).exists) batch.update(submissionRef, { status: 'pending' });
      }
      await batch.commit();
      await removePeopleWithoutTalks(speakerIds);
      revalidatePath('/admin/devfest/proposals');
    } else {
      await talkRef.update({
        speakerIds: FieldValue.arrayRemove(speakerId),
        [`speakerState.${speakerId}`]: FieldValue.delete(),
      });
      await removePeopleWithoutTalks([speakerId]);
    }

    revalidateLineup();
    return {};
  } catch {
    return { error: 'Could not remove this speaker. Please try again.' };
  }
}

// The photo itself is stored by replaceSpeakerPhoto (src/lib/people.ts), shared with the
// speaker portal.
export async function uploadSpeakerPhoto(speakerId: string, formData: FormData): Promise<{ error?: string; photoUrl?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    const result = await replaceSpeakerPhoto(speakerId, formData.get('photo'));
    if ('error' in result) return result;
    revalidateLineup();
    return { photoUrl: result.photoUrl };
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
    const failure = await clearSpeakerPhoto(speakerId);
    if (failure) return failure;
    revalidateLineup();
    return {};
  } catch {
    return { error: 'Could not remove this photo. Please try again.' };
  }
}
