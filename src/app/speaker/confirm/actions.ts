'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { Resend } from 'resend';
import { buildSpeakerConfirmedNotice } from '@/lib/acceptanceEmail';
import { verifySpeakerConfirmToken } from '@/lib/speakerConfirm';

const ORGANISER_INBOX = 'hello@gdgsydney.com';

// Tells the organisers a slot is settled. Deliberately not awaited on the critical path in
// a way that could fail the confirmation: the speaker has already done their part, and an
// email problem is ours, not theirs.
async function notifyOrganisers(submission: FirebaseFirestore.DocumentData, confirmedAt: Date) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `DevFest Sydney <${process.env.RESEND_FROM_EMAIL}>`,
      to: ORGANISER_INBOX,
      // So an organiser can reply straight to the speaker from the notification.
      replyTo: submission.email,
      subject: `Speaker confirmed: ${submission.name} - ${submission.talkTitle}`,
      html: buildSpeakerConfirmedNotice({
        name: submission.name,
        email: submission.email,
        talkTitle: submission.talkTitle,
        track: submission.track,
        format: submission.format,
        confirmedAtIso: confirmedAt.toISOString(),
      }),
    });
  } catch (err) {
    console.error('Organiser confirmation notice failed for submission:', submission.email, err);
  }
}

// The speaker has no session, so the signed token in the link is the only credential.
// Confirming is behind a button rather than the page load itself: mail scanners and link
// previewers fetch URLs on their own, and a GET that writes would confirm for them.
export async function confirmSpeakerParticipation(token: string): Promise<{ error?: string }> {
  const submissionId = verifySpeakerConfirmToken(token);
  if (!submissionId) {
    return { error: 'This confirmation link isn\'t valid. Please reply to your acceptance email and we\'ll sort it out.' };
  }

  try {
    const submissionRef = adminDb.collection('submissions').doc(submissionId);
    const snap = await submissionRef.get();
    if (!snap.exists || snap.data()?.status !== 'accepted') {
      return { error: 'This confirmation link is no longer active. Please reply to your acceptance email and we\'ll sort it out.' };
    }

    // A speaker clicking twice shouldn't move the date we recorded, shouldn't error at
    // them, and shouldn't email the organisers a second time.
    if (!snap.data()?.speakerConfirmedAt) {
      const confirmedAt = new Date();
      await submissionRef.update({ speakerConfirmedAt: Timestamp.fromDate(confirmedAt) });
      await notifyOrganisers(snap.data()!, confirmedAt);
    }

    return {};
  } catch {
    return { error: 'We couldn\'t record your confirmation just now. Please try again in a moment.' };
  }
}
