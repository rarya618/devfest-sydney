'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminSession } from '@/lib/adminSession';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { Resend } from 'resend';
import {
  buildVolunteerAcceptanceEmail,
  volunteerAcceptanceEmailSubject,
} from '@/lib/volunteerAcceptanceEmail';
import { volunteerConfirmDeadlineFrom, volunteerConfirmUrl } from '@/lib/volunteerConfirm';

// Accepting or un-accepting a signup moves it on and off /admin/crew, so both pages are
// revalidated wherever the status changes.
function revalidateVolunteerPages() {
  revalidatePath('/admin/volunteers');
  revalidatePath('/admin/crew');
}

export async function acceptVolunteer(volunteerId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    await adminDb.collection('volunteers').doc(volunteerId).update({ status: 'accepted' });
    revalidateVolunteerPages();
    return {};
  } catch {
    return { error: 'Could not accept this volunteer. Please try again.' };
  }
}

export async function rejectVolunteer(volunteerId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    await adminDb.collection('volunteers').doc(volunteerId).update({ status: 'rejected' });
    revalidateVolunteerPages();
    return {};
  } catch {
    return { error: 'Could not reject this volunteer. Please try again.' };
  }
}

export async function restoreVolunteer(volunteerId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    await adminDb.collection('volunteers').doc(volunteerId).update({ status: 'pending' });
    revalidateVolunteerPages();
    return {};
  } catch {
    return { error: 'Could not restore this volunteer. Please try again.' };
  }
}

export async function archiveVolunteer(volunteerId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    await adminDb.collection('volunteers').doc(volunteerId).update({ status: 'archived' });
    revalidateVolunteerPages();
    return {};
  } catch {
    return { error: 'Could not archive this volunteer. Please try again.' };
  }
}

export async function addVolunteerReviewerNote(volunteerId: string, text: string): Promise<{ error?: string }> {
  let authorName: string;
  try {
    ({ name: authorName } = await verifyAdminSession());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const trimmed = text.trim();
  if (!trimmed) return { error: 'Note can\'t be empty.' };
  if (trimmed.length > 2000) return { error: 'Note is too long (max 2000 characters).' };

  try {
    const volunteerRef = adminDb.collection('volunteers').doc(volunteerId);
    const snap = await volunteerRef.get();
    if (!snap.exists) return { error: 'Volunteer signup not found.' };

    await volunteerRef.update({
      reviewerNotes: FieldValue.arrayUnion({
        text: trimmed,
        authorName,
        createdAt: Timestamp.now(),
      }),
    });

    revalidateVolunteerPages();
    return {};
  } catch {
    return { error: 'Could not save this note. Please try again.' };
  }
}

// Tells an accepted volunteer they're on the crew, and asks them to confirm. A separate,
// explicit step from accepting, exactly as sendAcceptanceEmail is for speakers: accepting
// is a decision, emailing is telling someone about it, and an admin should choose when.
export async function sendVolunteerAcceptanceEmail(volunteerId: string): Promise<{ error?: string }> {
  let senderName: string;
  let senderEmail: string;
  try {
    ({ name: senderName, email: senderEmail } = await verifyAdminSession());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const volunteerRef = adminDb.collection('volunteers').doc(volunteerId);

  let volunteer: FirebaseFirestore.DocumentData;
  try {
    const snap = await volunteerRef.get();
    if (!snap.exists) return { error: 'Volunteer signup not found.' };
    volunteer = snap.data()!;
  } catch {
    return { error: 'Could not load this volunteer signup. Please try again.' };
  }

  if (volunteer.status !== 'accepted') {
    return { error: 'Only accepted volunteers can be sent an acceptance email. Accept this signup first.' };
  }

  const sentAt = new Date();
  const confirmBy = volunteerConfirmDeadlineFrom(sentAt);

  let confirmLink: string;
  try {
    confirmLink = volunteerConfirmUrl(volunteerId);
  } catch {
    // Thrown when VOLUNTEER_CONFIRM_SECRET is missing. Sending a welcome email with a
    // dead confirm button would be worse than not sending it at all.
    return { error: 'The volunteer confirmation link isn\'t configured on the server, so this email can\'t be sent yet.' };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `GDG Sydney <${process.env.RESEND_FROM_EMAIL}>`,
      to: volunteer.email,
      bcc: 'hello@gdgsydney.com',
      replyTo: 'hello@gdgsydney.com',
      subject: volunteerAcceptanceEmailSubject(),
      html: buildVolunteerAcceptanceEmail({
        name: volunteer.name,
        assignedArea: volunteer.assignedArea ?? '',
        assignedShift: volunteer.assignedShift ?? '',
        confirmUrl: confirmLink,
        confirmByIso: confirmBy.toISOString(),
      }),
    });
  } catch (err) {
    // Unlike the public form, this failure is surfaced: the admin is standing right there
    // and needs to know the volunteer was never told.
    console.error('Volunteer acceptance email failed for signup:', volunteerId, err);
    return { error: 'We couldn\'t send the acceptance email. Please try again in a moment.' };
  }

  try {
    await volunteerRef.update({
      acceptanceEmailSentAt: Timestamp.fromDate(sentAt),
      acceptanceEmailSentBy: senderEmail,
      confirmByDate: Timestamp.fromDate(confirmBy),
      reviewerNotes: FieldValue.arrayUnion({
        text: `Acceptance email sent by ${senderName}. Confirmation due ${confirmBy.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', timeZone: 'Australia/Sydney' })}.`,
        authorName: senderName,
        createdAt: Timestamp.now(),
      }),
    });
  } catch {
    // The email is already gone, so this is reported as a bookkeeping failure rather than
    // a send failure: resending would email the volunteer twice.
    return { error: 'The email was sent, but we couldn\'t record it against this signup. Please refresh before sending again.' };
  }

  revalidateVolunteerPages();
  return {};
}
