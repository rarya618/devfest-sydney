'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { Resend } from 'resend';
import { buildVolunteerConfirmedNotice } from '@/lib/volunteerAcceptanceEmail';
import { verifyVolunteerConfirmToken } from '@/lib/volunteerConfirm';

const ORGANISER_INBOX = 'hello@gdgsydney.com';

// Tells the organisers a crew spot is settled. A failure here is logged rather than
// surfaced: the volunteer has already done their part, and an email problem is ours.
async function notifyOrganisers(volunteer: FirebaseFirestore.DocumentData, confirmedAt: Date) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `DevFest Sydney <${process.env.RESEND_FROM_EMAIL}>`,
      to: ORGANISER_INBOX,
      // So an organiser can reply straight to the volunteer from the notification.
      replyTo: volunteer.email,
      subject: `Volunteer confirmed: ${volunteer.name}`,
      html: buildVolunteerConfirmedNotice({
        name: volunteer.name,
        email: volunteer.email,
        phone: volunteer.phone ?? '',
        assignedArea: volunteer.assignedArea ?? '',
        assignedShift: volunteer.assignedShift ?? '',
        confirmedAtIso: confirmedAt.toISOString(),
      }),
    });
  } catch (err) {
    console.error('Organiser volunteer confirmation notice failed for:', volunteer.email, err);
  }
}

// The volunteer has no session, so the signed token in the link is the only credential.
// Confirming is behind a button rather than the page load itself: mail scanners and link
// previewers fetch URLs on their own, and a GET that writes would confirm for them.
export async function confirmVolunteering(token: string): Promise<{ error?: string }> {
  const volunteerId = verifyVolunteerConfirmToken(token);
  if (!volunteerId) {
    return { error: 'This confirmation link isn\'t valid. Please reply to your acceptance email and we\'ll sort it out.' };
  }

  try {
    const volunteerRef = adminDb.collection('volunteers').doc(volunteerId);
    const snap = await volunteerRef.get();
    if (!snap.exists || snap.data()?.status !== 'accepted') {
      return { error: 'This confirmation link is no longer active. Please reply to your acceptance email and we\'ll sort it out.' };
    }

    // A volunteer clicking twice shouldn't move the date we recorded, shouldn't error at
    // them, and shouldn't email the organisers a second time.
    if (!snap.data()?.volunteerConfirmedAt) {
      const confirmedAt = new Date();
      await volunteerRef.update({ volunteerConfirmedAt: Timestamp.fromDate(confirmedAt) });
      await notifyOrganisers(snap.data()!, confirmedAt);
    }

    return {};
  } catch {
    return { error: 'We couldn\'t record your confirmation just now. Please try again in a moment.' };
  }
}
