'use server';

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
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
}

function validateCrewFields(fields: CrewEditableFields): { error: string } | { values: CrewEditableFields } {
  if (fields.assignedArea !== '' && !VOLUNTEER_AREAS.includes(fields.assignedArea)) {
    return { error: 'Please choose a valid area for this volunteer.' };
  }
  if (!VOLUNTEER_SHIFTS.includes(fields.assignedShift)) {
    return { error: 'Please choose a valid shift for this volunteer.' };
  }

  const photoUrl = fields.photoUrl.trim();
  if (photoUrl && (!photoUrl.startsWith('https://') || photoUrl.length > 500)) {
    return { error: 'Photo must be an https link, no longer than 500 characters.' };
  }

  return {
    values: {
      assignedArea: fields.assignedArea,
      assignedShift: fields.assignedShift,
      showOnCrewPage: Boolean(fields.showOnCrewPage),
      photoUrl,
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

    await volunteerRef.update({ ...validated.values });
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

    await volunteerRef.update({
      status: 'pending',
      assignedArea: '',
      assignedShift: '',
      showOnCrewPage: false,
    });
    revalidateCrewPages();
    return {};
  } catch {
    return { error: 'Could not remove this volunteer from the crew. Please try again.' };
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
