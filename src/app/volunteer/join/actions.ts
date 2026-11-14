'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { loadVolunteerInvite } from '@/lib/volunteerInvite';
import { VOLUNTEER_AREA_LABELS } from '@/lib/volunteerLabels';
import type { VolunteerArea } from '@/lib/types';

export interface InviteAnswers {
  phone: string;
  dietaryRequirements: string;
  areasOfInterest: VolunteerArea[];
  note: string;
}

// The same limits as /api/submit-volunteer.
const PHONE_MAX = 30;
const DIETARY_MAX = 300;
const NOTE_MAX = 1000;
const VALID_AREAS = Object.keys(VOLUNTEER_AREA_LABELS) as VolunteerArea[];

// Files a pending signup for the invited event, linked to the person's profile, which takes
// the phone number and dietary needs they confirmed. It lands in the normal review queue on
// /admin/devfest/volunteers; there is no confirmation email, since the page says what happens next
// and the acceptance email is still the organisers' step to send.
export async function acceptVolunteerInvite(token: string, answers: InviteAnswers): Promise<{ error?: string }> {
  let invite;
  try {
    invite = await loadVolunteerInvite(token);
  } catch {
    return { error: 'We couldn\'t check this invite just now. Please try again in a moment.' };
  }
  if (!invite) return { error: 'This invite link isn\'t valid. Write to hello@gdgsydney.com and we\'ll sort it out.' };
  if (invite.closedReason) return { error: `${invite.closedReason} Thanks for wanting to help.` };
  if (invite.alreadySignedUp) return {};

  const phone = answers.phone.trim();
  const dietaryRequirements = answers.dietaryRequirements.trim();
  const note = answers.note.trim();
  const areasOfInterest = [...new Set(answers.areasOfInterest)];
  if (phone.length > PHONE_MAX) return { error: `Your phone number must be ${PHONE_MAX} characters or fewer.` };
  if (dietaryRequirements.length > DIETARY_MAX) return { error: `Dietary requirements must be ${DIETARY_MAX} characters or fewer.` };
  if (note.length > NOTE_MAX) return { error: `Your note must be ${NOTE_MAX} characters or fewer.` };
  if (areasOfInterest.length === 0 || !areasOfInterest.every((area) => VALID_AREAS.includes(area))) {
    return { error: 'Please choose at least one area you\'d like to help with.' };
  }

  try {
    await adminDb.collection('volunteerProfiles').doc(invite.profileId).update({
      phone,
      dietaryRequirements,
      updatedAt: FieldValue.serverTimestamp(),
    });
    await adminDb.collection('volunteers').add({
      profileId: invite.profileId,
      eventId: invite.event.id,
      // The public form's "why" question, which a returning volunteer has answered before.
      motivation: note,
      areasOfInterest,
      tracking: { ref: 'volunteer-invite' },
      submittedAt: FieldValue.serverTimestamp(),
      status: 'pending',
    });
  } catch (error) {
    console.error('Saving an invited volunteer failed:', invite.profileId, error);
    return { error: 'We couldn\'t save your answer just now. Please try again in a moment.' };
  }
  return {};
}
