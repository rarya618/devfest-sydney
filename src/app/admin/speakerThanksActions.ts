'use server';

import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminSession } from '@/lib/adminSession';
import { EMAIL_PATTERN } from '@/lib/jobBoardLabels';
import { fetchSpeakerPhotosUrl, loadThanksRecipient, thanksUrl, type ThanksRecipient } from '@/lib/speakerThanks';
import { buildSpeakerThanksEmail, speakerThanksEmailSubject } from '@/lib/speakerThanksEmail';

// The post-event thank-you: photos, plus the link to claim a mug and an Asana trial. Sent
// to leads and co-speakers alike, each against their own speaker document, and only once
// their session was confirmed: someone who never said yes didn't speak. `emailSent` is set
// on the one failure where the email did go out, so the bulk send can tell the admin not
// to retry that speaker.
export async function sendSpeakerThanksEmail(speakerId: string): Promise<{ error?: string; emailSent?: boolean }> {
  let senderEmail: string;
  try {
    ({ email: senderEmail } = await verifyAdminSession());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  let recipient: ThanksRecipient | null;
  let photosUrl: string | null;
  try {
    [recipient, photosUrl] = await Promise.all([loadThanksRecipient(speakerId), fetchSpeakerPhotosUrl()]);
  } catch {
    return { error: 'Could not load this speaker. Please try again.' };
  }

  if (!photosUrl) {
    return { error: 'The photos link isn\'t set yet, so the thank-you can\'t be sent. Add it as speakerPhotosUrl on settings/site.' };
  }
  if (!recipient) {
    return { error: 'This speaker\'s session was never confirmed, so they can\'t be sent a thank-you.' };
  }
  if (!EMAIL_PATTERN.test(recipient.email)) {
    return { error: 'This speaker\'s email address doesn\'t look right. Fix it with Edit before sending.' };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: `GDG Sydney <${process.env.RESEND_FROM_EMAIL}>`,
      to: recipient.email,
      replyTo: 'hello@gdgsydney.com',
      subject: speakerThanksEmailSubject(),
      html: buildSpeakerThanksEmail({ name: recipient.name, photosUrl, thanksUrl: thanksUrl(speakerId) }),
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    console.error('Thank-you email failed for speaker:', speakerId, err);
    return { error: 'We couldn\'t send the thank-you email. Please try again in a moment.' };
  }

  try {
    await adminDb.collection('speakers').doc(speakerId).update({
      thanksEmailSentAt: Timestamp.now(),
      thanksEmailSentBy: senderEmail,
    });
  } catch {
    return {
      error: 'The thank-you was sent, but we couldn\'t record it. Refresh the page before sending again.',
      emailSent: true,
    };
  }

  revalidatePath('/admin/speakers');
  revalidatePath('/admin/speaker-gifts');
  return {};
}

// For a speaker who asks to be taken off the list.
export async function deleteSpeakerGift(speakerId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    await adminDb.collection('speakerGifts').doc(speakerId).delete();
    revalidatePath('/admin/speaker-gifts');
    return {};
  } catch {
    return { error: 'Could not delete this answer. Please try again.' };
  }
}

// /privacy promises the addresses and work emails go once the mugs have shipped and the
// Asana list has been passed on. This is that step.
export async function deleteAllSpeakerGifts(): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    const snapshot = await adminDb.collection('speakerGifts').get();
    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    revalidatePath('/admin/speaker-gifts');
    return {};
  } catch {
    return { error: 'Could not delete the answers. Please try again.' };
  }
}
