'use server';

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { verifyAdminSession } from '@/lib/adminSession';
import type { VolunteerArea, VolunteerShift } from '@/lib/types';

const VOLUNTEER_AREAS: VolunteerArea[] = [
  'registration',
  'av-tech',
  'speaker-support',
  'workshop-facilitator',
  'general-floater',
  'setup-packdown',
  'photography',
  'social-media',
  'merch-table',
];
const VOLUNTEER_SHIFTS: VolunteerShift[] = ['', 'full-day', 'morning', 'afternoon'];

// What an admin may change about an accepted volunteer from /admin/crew. Deliberately
// only the roster and announcement fields: the answers the volunteer gave on the form are
// their words, and an organiser correcting a motivation paragraph helps nobody.
export interface CrewEditableFields {
  assignedArea: VolunteerArea | '';
  assignedShift: VolunteerShift;
  showOnCrewPage: boolean;
  photoUrl: string;
  // Organisers only, and ignored for anyone who came through the signup form: a
  // volunteer's job on the day is an assignedArea, and their LinkedIn was never asked for.
  organiserRole: string;
  linkedinUrl: string;
}

// What an admin types to put an organiser on the crew. Organisers never filled the
// signup form in, so this is the whole record: there is no motivation, no availability
// and no areas of interest to carry across.
export interface NewOrganiserFields {
  name: string;
  email: string;
  phone: string;
  organiserRole: string;
  linkedinUrl: string;
  assignedShift: VolunteerShift;
  showOnCrewPage: boolean;
}

const ORGANISER_ROLE_MAX = 80;
const LINK_MAX = 500;

function validateLink(value: string, label: string): { error: string } | { value: string } {
  const link = value.trim();
  if (!link) return { value: '' };
  if (!link.startsWith('https://') || link.length > LINK_MAX) {
    return { error: `${label} must be an https link, no longer than ${LINK_MAX} characters.` };
  }
  return { value: link };
}

function validateCrewFields(fields: CrewEditableFields): { error: string } | { values: CrewEditableFields } {
  if (fields.assignedArea !== '' && !VOLUNTEER_AREAS.includes(fields.assignedArea)) {
    return { error: 'Please choose a valid area for this volunteer.' };
  }
  if (!VOLUNTEER_SHIFTS.includes(fields.assignedShift)) {
    return { error: 'Please choose a valid shift for this volunteer.' };
  }

  const photo = validateLink(fields.photoUrl, 'Photo');
  if ('error' in photo) return { error: photo.error };

  const linkedin = validateLink(fields.linkedinUrl, 'LinkedIn');
  if ('error' in linkedin) return { error: linkedin.error };

  const organiserRole = fields.organiserRole.trim();
  if (organiserRole.length > ORGANISER_ROLE_MAX) {
    return { error: `Role is too long. Please keep it to ${ORGANISER_ROLE_MAX} characters or fewer.` };
  }

  return {
    values: {
      assignedArea: fields.assignedArea,
      assignedShift: fields.assignedShift,
      showOnCrewPage: Boolean(fields.showOnCrewPage),
      photoUrl: photo.value,
      organiserRole,
      linkedinUrl: linkedin.value,
    },
  };
}

export async function updateCrewMember(volunteerId: string, fields: CrewEditableFields): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const validated = validateCrewFields(fields);
  if ('error' in validated) return { error: validated.error };

  try {
    const volunteerRef = adminDb.collection('volunteers').doc(volunteerId);
    const snapshot = await volunteerRef.get();
    if (!snapshot.exists) return { error: 'Volunteer signup not found.' };
    // The crew page only ever holds accepted volunteers, so an edit arriving for one that
    // has since been rejected elsewhere is a stale tab rather than a legitimate change.
    if (snapshot.data()?.status !== 'accepted') {
      return { error: 'This volunteer is no longer on the crew. Refresh the page to see their current status.' };
    }

    // The two kinds of crew member own different halves of the form: an organiser has a
    // role and a LinkedIn, a volunteer has an assigned area. Writing the other half would
    // store a value nothing renders and the modal never offered.
    const isOrganiser = Boolean(snapshot.data()?.isOrganiser);
    const { assignedArea, organiserRole, linkedinUrl, ...shared } = validated.values;
    await volunteerRef.update(
      isOrganiser
        ? { ...shared, organiserRole, linkedinUrl }
        : { ...shared, assignedArea }
    );
    revalidateCrewPages();
    return {};
  } catch {
    return { error: 'Could not save this crew member. Please try again.' };
  }
}

// Takes a volunteer off the crew and puts their signup back to pending, the same as
// Restore on /admin/volunteers, so the two entry points can't disagree. The roster fields
// are cleared with it: a shift and an area left behind would reappear if they were later
// accepted again, and would quietly ride along into the next acceptance email.
export async function removeFromCrew(volunteerId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    const volunteerRef = adminDb.collection('volunteers').doc(volunteerId);
    const snapshot = await volunteerRef.get();
    if (!snapshot.exists) return { error: 'Volunteer signup not found.' };

    // An organiser has no signup behind them to go back to, so removing one deletes the
    // record outright. Leaving it as a pending volunteer would put a person who never
    // applied at the top of the review queue.
    if (snapshot.data()?.isOrganiser) {
      await volunteerRef.delete();
      await deleteManagedPhoto(snapshot.data()?.photoUrl as string | undefined);
    } else {
      await volunteerRef.update({
        status: 'pending',
        assignedArea: '',
        assignedShift: '',
        showOnCrewPage: false,
      });
    }
    revalidateCrewPages();
    return {};
  } catch {
    return { error: 'Could not remove this crew member. Please try again.' };
  }
}

// Puts an organiser straight onto the crew. They are stored in `volunteers` alongside
// the signups because the crew is one roster and everything that manages it (the roster
// fields, the photo upload, the public page) already reads that collection; the
// isOrganiser flag is what keeps them out of the signup review queue and the analytics.
export async function addOrganiser(fields: NewOrganiserFields): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const name = fields.name.trim();
  if (!name || name.length > 100) {
    return { error: 'Please give this organiser a name, no longer than 100 characters.' };
  }

  const email = fields.email.trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 200) {
    return { error: 'Please enter a valid email address for this organiser.' };
  }

  const phone = fields.phone.trim();
  if (phone.length > 30) {
    return { error: 'That phone number is too long. Please keep it to 30 characters or fewer.' };
  }

  const organiserRole = fields.organiserRole.trim();
  if (!organiserRole || organiserRole.length > ORGANISER_ROLE_MAX) {
    return { error: `Please give this organiser a role, no longer than ${ORGANISER_ROLE_MAX} characters.` };
  }

  const linkedin = validateLink(fields.linkedinUrl, 'LinkedIn');
  if ('error' in linkedin) return { error: linkedin.error };

  if (!VOLUNTEER_SHIFTS.includes(fields.assignedShift)) {
    return { error: 'Please choose a valid shift for this organiser.' };
  }

  try {
    await adminDb.collection('volunteers').add({
      name,
      email,
      phone,
      organiserRole,
      linkedinUrl: linkedin.value,
      isOrganiser: true,
      // Accepted on creation: an organiser is on the crew the moment they are added,
      // which is the state every crew query filters on.
      status: 'accepted',
      submittedAt: FieldValue.serverTimestamp(),
      assignedArea: '',
      assignedShift: fields.assignedShift,
      showOnCrewPage: Boolean(fields.showOnCrewPage),
      photoUrl: '',
      // The signup form's answers, empty because there was no form. Written rather than
      // left absent so every document in the collection has the same shape.
      motivation: '',
      areasOfInterest: [],
      priorExperience: '',
      googleTechExperience: '',
      isTorrensStudentOrStaff: false,
      hasBeenGdgOnCampusExec: false,
      gdgOnCampusChapter: '',
      dietaryRequirements: '',
      reviewerNotes: [],
    });
    revalidateCrewPages();
    return {};
  } catch {
    return { error: 'Could not add this organiser. Please try again.' };
  }
}

const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

// Mirrors uploadSpeakerPhoto, under its own crew-photos/ prefix so the two sets can be
// reasoned about (and deleted) separately.
export async function uploadCrewPhoto(volunteerId: string, formData: FormData): Promise<{ error?: string; photoUrl?: string }> {
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
    const volunteerRef = adminDb.collection('volunteers').doc(volunteerId);
    const snapshot = await volunteerRef.get();
    if (!snapshot.exists) return { error: 'Volunteer signup not found.' };

    const bucket = adminStorage.bucket();
    const objectPath = `crew-photos/${volunteerId}/${randomUUID()}.${extension}`;
    const file = bucket.file(objectPath);
    await file.save(Buffer.from(await photo.arrayBuffer()), {
      contentType: photo.type,
      metadata: { cacheControl: 'public, max-age=31536000, immutable' },
    });
    await file.makePublic();

    const photoUrl = `https://storage.googleapis.com/${bucket.name}/${objectPath}`;
    await volunteerRef.update({ photoUrl });

    await deleteManagedPhoto(snapshot.data()?.photoUrl as string | undefined);

    revalidateCrewPages();
    return { photoUrl };
  } catch {
    return { error: 'Could not upload this photo. Please try again.' };
  }
}

export async function removeCrewPhoto(volunteerId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    const volunteerRef = adminDb.collection('volunteers').doc(volunteerId);
    const snapshot = await volunteerRef.get();
    if (!snapshot.exists) return { error: 'Volunteer signup not found.' };

    await volunteerRef.update({ photoUrl: '' });
    await deleteManagedPhoto(snapshot.data()?.photoUrl as string | undefined);

    revalidateCrewPages();
    return {};
  } catch {
    return { error: 'Could not remove this photo. Please try again.' };
  }
}

function revalidateCrewPages() {
  revalidatePath('/admin/crew');
  revalidatePath('/admin/volunteers');
  revalidatePath('/crew');
  // The landing page's organisers section reads the same records.
  revalidatePath('/');
}

// Only deletes objects this page uploaded (under crew-photos/). Deletion failures are
// swallowed: an orphaned file in the bucket is far cheaper than a failed replacement.
async function deleteManagedPhoto(photoUrl: string | undefined): Promise<void> {
  if (!photoUrl) return;
  const bucket = adminStorage.bucket();
  const prefix = `https://storage.googleapis.com/${bucket.name}/crew-photos/`;
  if (!photoUrl.startsWith(prefix)) return;
  const objectPath = decodeURIComponent(photoUrl.slice(`https://storage.googleapis.com/${bucket.name}/`.length));
  try {
    await bucket.file(objectPath).delete({ ignoreNotFound: true });
  } catch {
    // Orphaned object; nothing the admin can act on.
  }
}
