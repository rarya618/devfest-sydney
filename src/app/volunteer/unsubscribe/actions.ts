'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { verifyVolunteerOptOutToken } from '@/lib/volunteerInvite';

// Takes someone out of the volunteer pool (stage 4d-2). Their profile and their past signups
// stay: this stops the "want to crew?" emails, nothing else. Organisers can see it on
// /admin/volunteer-pool, and adding them back there undoes it if they ask to be on the list.
export async function optOutOfVolunteerInvites(token: string): Promise<{ error?: string }> {
  const profileId = (() => {
    try {
      return verifyVolunteerOptOutToken(token);
    } catch {
      return null;
    }
  })();
  if (!profileId) return { error: 'This link isn\'t valid. Write to hello@gdgsydney.com and we\'ll take you off the list.' };

  try {
    const profileRef = adminDb.collection('volunteerProfiles').doc(profileId);
    if (!(await profileRef.get()).exists) return {};
    await profileRef.update({
      inviteOptOut: true,
      inviteOptOutAt: FieldValue.serverTimestamp(),
      inPool: FieldValue.delete(),
      inPoolAt: FieldValue.delete(),
      inPoolBy: FieldValue.delete(),
    });
    return {};
  } catch {
    return { error: 'We couldn\'t update this just now. Please try again in a moment.' };
  }
}
