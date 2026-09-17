'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminSession } from '@/lib/adminSession';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { Resend } from 'resend';
import { acceptanceEmailSubject, buildAcceptanceEmail } from '@/lib/acceptanceEmail';
import { buildSpeakerTicketEmail, speakerTicketEmailSubject } from '@/lib/speakerTicketEmail';
import { buildRejectionEmail, rejectionEmailSubject } from '@/lib/rejectionEmail';
import { confirmDeadlineFrom, confirmUrl } from '@/lib/speakerConfirm';
import { normaliseProfileUrl } from '@/lib/speakers';
import type { ExperienceLevel, TalkFormat, Track } from '@/lib/types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The half of a speaker record the acceptance email renders, shared by the promoted
// speaker document and the proposal it fell back to.
interface AcceptanceEmailSession {
  name: string;
  email: string;
  talkTitle: string;
  format: TalkFormat;
  track: Track;
  experienceLevel: ExperienceLevel;
}

export async function addAdmin(email: string, name: string): Promise<{ error?: string }> {
  let currentAdminEmail: string;
  try {
    ({ email: currentAdminEmail } = await verifyAdminSession());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return { error: 'Please enter a valid email address.' };
  }

  try {
    const adminRef = adminDb.collection('admins').doc(normalizedEmail);
    const existing = await adminRef.get();
    if (existing.exists) {
      return { error: 'This person already has admin access.' };
    }

    await adminRef.set({
      name: name.trim(),
      addedAt: FieldValue.serverTimestamp(),
      addedBy: currentAdminEmail,
    });

    revalidatePath('/admin/admins');
    return {};
  } catch {
    return { error: 'Could not add this admin. Please try again.' };
  }
}

export async function removeAdmin(email: string): Promise<{ error?: string }> {
  let currentAdminEmail: string;
  try {
    ({ email: currentAdminEmail } = await verifyAdminSession());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail === currentAdminEmail) {
    return { error: 'You can\'t remove your own admin access.' };
  }

  try {
    const adminsSnap = await adminDb.collection('admins').get();
    if (adminsSnap.size <= 1) {
      return { error: 'At least one admin must remain.' };
    }

    await adminDb.collection('admins').doc(normalizedEmail).delete();
    revalidatePath('/admin/admins');
    return {};
  } catch {
    return { error: 'Could not remove this admin. Please try again.' };
  }
}

export async function promoteSubmission(submissionId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    const submissionRef = adminDb.collection('submissions').doc(submissionId);
    const snap = await submissionRef.get();
    if (!snap.exists) return { error: 'Submission not found.' };

    const data = snap.data()!;

    await adminDb.collection('speakers').add({
      name: data.name,
      email: data.email,
      talkTitle: data.talkTitle,
      abstract: data.abstract,
      format: data.format,
      track: data.track,
      experienceLevel: data.experienceLevel,
      linkedinUrl: normaliseProfileUrl(data.linkedinUrl ?? ''),
      githubUrl: normaliseProfileUrl(data.githubUrl ?? ''),
      websiteUrl: normaliseProfileUrl(data.websiteUrl ?? ''),
      submissionId,
      promotedAt: FieldValue.serverTimestamp(),
      bio: data.speakerBio ?? '',
      tagline: data.speakerTagline ?? '',
      photoUrl: '',
    });

    await submissionRef.update({ status: 'accepted' });
    revalidatePath('/admin');
    return {};
  } catch {
    return { error: 'Could not promote this submission. Please try again.' };
  }
}

export async function addReviewerNote(submissionId: string, text: string): Promise<{ error?: string }> {
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
    const submissionRef = adminDb.collection('submissions').doc(submissionId);
    const snap = await submissionRef.get();
    if (!snap.exists) return { error: 'Submission not found.' };

    await submissionRef.update({
      reviewerNotes: FieldValue.arrayUnion({
        text: trimmed,
        authorName,
        createdAt: Timestamp.now(),
      }),
    });

    revalidatePath('/admin');
    return {};
  } catch {
    return { error: 'Could not save this note. Please try again.' };
  }
}

export async function deleteReviewerNote(submissionId: string, noteIndex: number): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    const submissionRef = adminDb.collection('submissions').doc(submissionId);
    const snap = await submissionRef.get();
    if (!snap.exists) return { error: 'Submission not found.' };

    const notes = (snap.data()?.reviewerNotes ?? []) as unknown[];
    if (noteIndex < 0 || noteIndex >= notes.length) return { error: 'Note not found.' };

    await submissionRef.update({
      reviewerNotes: notes.filter((_, index) => index !== noteIndex),
    });

    revalidatePath('/admin');
    return {};
  } catch {
    return { error: 'Could not delete this note. Please try again.' };
  }
}

export interface SubmissionEditableFields {
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
  speakerTagline: string;
  speakerBio: string;
  previousTalkLink: string;
  accessibilityNeeds: string;
  travelSupportLocation: string;
  coSpeakerEmails: string;
  requiresTravelSupport: boolean;
  isGoogleDeveloperExpert: boolean;
  isFirstTimeSpeaker: boolean;
  wantsMentoring: boolean;
  hasSpokenAtGdgSydneyBefore: boolean;
  isOpenToAudienceQuestions: boolean;
  optOutOfRecording: boolean;
  trackingUtmSource: string;
  trackingUtmMedium: string;
  trackingUtmCampaign: string;
  trackingUtmContent: string;
  trackingUtmTerm: string;
  trackingRef: string;
}

const TALK_FORMATS: TalkFormat[] = ['talk', 'lightning-talk', 'workshop'];
const TRACKS: Track[] = ['developer', 'builder', 'workshop', 'showcase'];
const EXPERIENCE_LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];

// The exact shape a submission document takes in Firestore, matching what
// /api/submit-proposal writes. Kept explicit so a manually added proposal and a
// form-submitted one are indistinguishable to everything downstream.
interface SubmissionDocumentFields {
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
  speakerTagline: string;
  speakerBio: string;
  previousTalkLink: string;
  accessibilityNeeds: string;
  travelSupportLocation: string;
  coSpeakerEmails: string;
  requiresTravelSupport: boolean;
  isGoogleDeveloperExpert: boolean;
  isFirstTimeSpeaker: boolean;
  wantsMentoring: boolean;
  hasSpokenAtGdgSydneyBefore: boolean;
  isOpenToAudienceQuestions: boolean;
  optOutOfRecording: boolean;
  tracking: {
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    utm_content: string;
    utm_term: string;
    ref: string;
  };
}

// Shared by updateSubmission and createSubmission so the two can never drift: an
// admin-entered proposal is held to the same rules as an edited one.
function validateSubmissionFields(
  fields: SubmissionEditableFields
): { error: string } | { values: SubmissionDocumentFields } {
  const name = fields.name.trim();
  const email = fields.email.trim().toLowerCase();
  const talkTitle = fields.talkTitle.trim();
  const abstract = fields.abstract.trim();

  if (!name || !email || !talkTitle || !abstract) {
    return { error: 'Name, email, talk title, and abstract can\'t be empty.' };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { error: 'Please enter a valid email address.' };
  }
  if (!TALK_FORMATS.includes(fields.format)) {
    return { error: 'Please select a valid talk format.' };
  }
  if (!TRACKS.includes(fields.track)) {
    return { error: 'Please select a valid track.' };
  }
  if (!EXPERIENCE_LEVELS.includes(fields.experienceLevel)) {
    return { error: 'Please select a valid experience level.' };
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
      linkedinUrl: fields.linkedinUrl.trim(),
      githubUrl: fields.githubUrl.trim(),
      websiteUrl: fields.websiteUrl.trim(),
      speakerTagline: fields.speakerTagline.trim(),
      speakerBio: fields.speakerBio.trim(),
      previousTalkLink: fields.previousTalkLink.trim(),
      accessibilityNeeds: fields.accessibilityNeeds.trim(),
      travelSupportLocation: fields.travelSupportLocation.trim(),
      coSpeakerEmails: fields.coSpeakerEmails.trim(),
      requiresTravelSupport: fields.requiresTravelSupport,
      isGoogleDeveloperExpert: fields.isGoogleDeveloperExpert,
      isFirstTimeSpeaker: fields.isFirstTimeSpeaker,
      wantsMentoring: fields.wantsMentoring,
      hasSpokenAtGdgSydneyBefore: fields.hasSpokenAtGdgSydneyBefore,
      isOpenToAudienceQuestions: fields.isOpenToAudienceQuestions,
      optOutOfRecording: fields.optOutOfRecording,
      tracking: {
        utm_source: fields.trackingUtmSource.trim(),
        utm_medium: fields.trackingUtmMedium.trim(),
        utm_campaign: fields.trackingUtmCampaign.trim(),
        utm_content: fields.trackingUtmContent.trim(),
        utm_term: fields.trackingUtmTerm.trim(),
        ref: fields.trackingRef.trim(),
      },
    },
  };
}

export async function updateSubmission(
  submissionId: string,
  fields: SubmissionEditableFields
): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const validated = validateSubmissionFields(fields);
  if ('error' in validated) return { error: validated.error };

  try {
    const submissionRef = adminDb.collection('submissions').doc(submissionId);
    const snap = await submissionRef.get();
    if (!snap.exists) return { error: 'Submission not found.' };

    await submissionRef.update({ ...validated.values });

    revalidatePath('/admin');
    return {};
  } catch {
    return { error: 'Could not save these changes. Please try again.' };
  }
}

// A proposal that reached us outside the form: emailed after the deadline, an invited
// speaker, a showcase entry taken down by an organiser. No confirmation email is sent,
// unlike /api/submit-proposal: whoever is entering this is already in a thread with the
// speaker, so an automated "we've got your submission" would only be confusing.
export async function createSubmission(
  fields: SubmissionEditableFields,
  submittedAtIso: string
): Promise<{ error?: string }> {
  let authorName: string;
  try {
    ({ name: authorName } = await verifyAdminSession());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const validated = validateSubmissionFields(fields);
  if ('error' in validated) return { error: validated.error };

  // Defaults to now, but an organiser can set the date the proposal actually reached
  // them. Without that, a late entry sorts to the top of the dashboard and lands on the
  // analytics chart on the day it was typed in rather than the day it was sent.
  let submittedAt: Timestamp;
  if (submittedAtIso.trim()) {
    const parsedDate = new Date(submittedAtIso);
    if (Number.isNaN(parsedDate.getTime())) {
      return { error: 'Please enter a valid date and time for when this was submitted.' };
    }
    submittedAt = Timestamp.fromDate(parsedDate);
  } else {
    submittedAt = Timestamp.now();
  }

  try {
    await adminDb.collection('submissions').add({
      ...validated.values,
      submittedAt,
      status: 'pending',
      // Provenance as a reviewer note rather than a bespoke field: the notes panel
      // already renders in the dashboard, so a reviewer months from now can see this
      // never came through the public form. A hidden flag nothing displays could not.
      reviewerNotes: [
        {
          text: `Added manually by ${authorName}. This proposal did not come through the public Call for Speakers form.`,
          authorName,
          createdAt: Timestamp.now(),
        },
      ],
    });
  } catch {
    return { error: 'Could not add this submission. Please try again.' };
  }

  revalidatePath('/admin');
  return {};
}

export async function undoPromotion(submissionId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    const speakersSnap = await adminDb
      .collection('speakers')
      .where('submissionId', '==', submissionId)
      .get();

    const batch = adminDb.batch();
    speakersSnap.docs.forEach((doc) => batch.delete(doc.ref));
    batch.update(adminDb.collection('submissions').doc(submissionId), { status: 'pending' });
    await batch.commit();

    revalidatePath('/admin');
    return {};
  } catch {
    return { error: 'Could not undo this acceptance. Please try again.' };
  }
}

export async function rejectSubmission(submissionId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    await adminDb.collection('submissions').doc(submissionId).update({ status: 'rejected' });
    revalidatePath('/admin');
    return {};
  } catch {
    return { error: 'Could not reject this submission. Please try again.' };
  }
}

export async function restoreSubmission(submissionId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    await adminDb.collection('submissions').doc(submissionId).update({ status: 'pending' });
    revalidatePath('/admin');
    return {};
  } catch {
    return { error: 'Could not restore this submission. Please try again.' };
  }
}

export async function archiveSubmission(submissionId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    const submissionRef = adminDb.collection('submissions').doc(submissionId);
    const snap = await submissionRef.get();
    if (!snap.exists) return { error: 'Submission not found.' };
    if (snap.data()?.status === 'accepted') {
      return { error: 'Accepted submissions can\'t be archived. Undo the acceptance first.' };
    }

    await submissionRef.update({ status: 'archived' });
    revalidatePath('/admin');
    return {};
  } catch {
    return { error: 'Could not archive this submission. Please try again.' };
  }
}

// The speaker document promoted from a submission, or null when the proposal was accepted
// but never promoted. Only the fields the emails need are read back, and a document missing
// any of them is ignored so a half-written record can't blank one. All or nothing on
// purpose: a record good enough to address is good enough to quote, and mailing the edited
// title to the address on the proposal would be the same bug twice.
async function fetchPromotedSpeaker(submissionId: string): Promise<AcceptanceEmailSession | null> {
  let snapshot;
  try {
    snapshot = await adminDb.collection('speakers').where('submissionId', '==', submissionId).limit(1).get();
  } catch {
    // The proposal is a workable fallback, so a failed lookup shouldn't block the send.
    return null;
  }

  if (snapshot.empty) return null;

  const speaker = snapshot.docs[0].data();
  const { name, email, talkTitle, format, track, experienceLevel } = speaker;
  if (!name || !talkTitle || !format || !track || !experienceLevel) return null;
  // An address the admin has corrected in the profile is the one to use, but only if it is
  // actually an address: a broken one would bounce the email into nowhere.
  if (!email || !EMAIL_PATTERN.test(email)) return null;

  return { name, email, talkTitle, format, track, experienceLevel };
}

// Telling an accepted speaker is a separate, deliberate step from accepting them: bulk
// accept would otherwise fire a batch of emails, and undoing an acceptance can't unsend
// one. Records when it went and who sent it so a second organiser can see it's been done.
export async function sendAcceptanceEmail(submissionId: string): Promise<{ error?: string }> {
  let senderName: string;
  let senderEmail: string;
  try {
    ({ name: senderName, email: senderEmail } = await verifyAdminSession());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const submissionRef = adminDb.collection('submissions').doc(submissionId);

  let submission: FirebaseFirestore.DocumentData;
  try {
    const snap = await submissionRef.get();
    if (!snap.exists) return { error: 'Submission not found.' };
    submission = snap.data()!;
  } catch {
    return { error: 'Could not load this submission. Please try again.' };
  }

  if (submission.status !== 'accepted') {
    return { error: 'Only accepted submissions can be sent an acceptance email. Accept this proposal first.' };
  }

  // An admin who edits a talk title, track or address in /admin/speakers expects a resend
  // to carry the correction. The speaker document is the edited, authoritative version of
  // the speaker, so it wins wherever it exists; the proposal is the fallback for a
  // submission that was accepted but never promoted.
  const promotedSpeaker = await fetchPromotedSpeaker(submissionId);
  const session = promotedSpeaker ?? submission;

  const sentAt = new Date();
  const confirmBy = confirmDeadlineFrom(sentAt);

  let confirmLink: string;
  try {
    confirmLink = confirmUrl(submissionId);
  } catch {
    // Thrown when SPEAKER_CONFIRM_SECRET is missing. Sending an acceptance email with a
    // dead confirm button would be worse than not sending it at all.
    return { error: 'The speaker confirmation link isn\'t configured on the server, so this email can\'t be sent yet.' };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `GDG Sydney <${process.env.RESEND_FROM_EMAIL}>`,
      to: session.email,
      bcc: 'hello@gdgsydney.com',
      replyTo: 'hello@gdgsydney.com',
      subject: acceptanceEmailSubject(session.talkTitle),
      html: buildAcceptanceEmail({
        name: session.name,
        talkTitle: session.talkTitle,
        format: session.format,
        track: session.track,
        experienceLevel: session.experienceLevel,
        confirmUrl: confirmLink,
        confirmByIso: confirmBy.toISOString(),
      }),
    });
  } catch (err) {
    // Unlike the public form, this failure is surfaced: the admin is standing right there
    // and needs to know the speaker was never told.
    console.error('Acceptance email failed for submission:', submissionId, err);
    return { error: 'We couldn\'t send the acceptance email. Please try again in a moment.' };
  }

  try {
    await submissionRef.update({
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
    // a send failure: resending would email the speaker twice.
    return { error: 'The email was sent, but we couldn\'t record it against this submission. Please refresh before sending again.' };
  }

  // The speakers page shows the same chip, joined from the submission.
  revalidatePath('/admin');
  revalidatePath('/admin/speakers');
  return {};
}

// The complimentary speaker ticket, sent once the speaker has confirmed. Gated on the
// confirmation rather than on the acceptance: the ticket link unlocks a free ticket, so it
// only goes to people who have actually said they are coming. Like the acceptance email
// this is an explicit admin action, not a side effect of confirming, so an organiser can
// hold it back while a slot is still in question.
export async function sendSpeakerTicketEmail(submissionId: string): Promise<{ error?: string }> {
  let senderName: string;
  let senderEmail: string;
  try {
    ({ name: senderName, email: senderEmail } = await verifyAdminSession());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const ticketUrl = process.env.SPEAKER_TICKET_URL?.trim();
  if (!ticketUrl) {
    return { error: 'The speaker ticket link isn\'t configured on the server, so this email can\'t be sent yet.' };
  }

  const submissionRef = adminDb.collection('submissions').doc(submissionId);

  let submission: FirebaseFirestore.DocumentData;
  try {
    const snap = await submissionRef.get();
    if (!snap.exists) return { error: 'Submission not found.' };
    submission = snap.data()!;
  } catch {
    return { error: 'Could not load this submission. Please try again.' };
  }

  if (submission.status !== 'accepted') {
    return { error: 'Only accepted submissions can be sent a speaker ticket. Accept this proposal first.' };
  }
  if (!submission.speakerConfirmedAt) {
    return { error: 'This speaker hasn\'t confirmed their participation yet, so the ticket can\'t be sent.' };
  }

  // Same reasoning as the acceptance email: the promoted speaker is the edited record, so
  // a corrected name or address is carried here too.
  const speaker = (await fetchPromotedSpeaker(submissionId)) ?? submission;

  const sentAt = new Date();

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `GDG Sydney <${process.env.RESEND_FROM_EMAIL}>`,
      to: speaker.email,
      bcc: 'hello@gdgsydney.com',
      replyTo: 'hello@gdgsydney.com',
      subject: speakerTicketEmailSubject(),
      html: buildSpeakerTicketEmail({
        name: speaker.name,
        ticketUrl,
      }),
    });
  } catch (err) {
    // Surfaced to the admin for the same reason as the acceptance email: they are the only
    // one who can tell that the speaker never got their ticket.
    console.error('Speaker ticket email failed for submission:', submissionId, err);
    return { error: 'We couldn\'t send the speaker ticket email. Please try again in a moment.' };
  }

  try {
    await submissionRef.update({
      speakerTicketEmailSentAt: Timestamp.fromDate(sentAt),
      speakerTicketEmailSentBy: senderEmail,
      reviewerNotes: FieldValue.arrayUnion({
        text: `Speaker ticket link emailed by ${senderName}.`,
        authorName: senderName,
        createdAt: Timestamp.now(),
      }),
    });
  } catch {
    return { error: 'The ticket email was sent, but we couldn\'t record it against this submission. Please refresh before sending again.' };
  }

  revalidatePath('/admin');
  revalidatePath('/admin/speakers');
  return {};
}

// Telling a speaker their proposal wasn't accepted, sent explicitly for the same reasons as
// the acceptance email: bulk reject would otherwise mail a batch of people at once, and
// Restore can't unsend one. Rejected proposals are never promoted, so the submission is
// the only record to read from.
// `emailSent` is set on the one failure where the email did go out, so the bulk send can
// tell the admin not to retry that speaker rather than mailing them twice.
export async function sendRejectionEmail(submissionId: string): Promise<{ error?: string; emailSent?: boolean }> {
  let senderName: string;
  let senderEmail: string;
  try {
    ({ name: senderName, email: senderEmail } = await verifyAdminSession());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const submissionRef = adminDb.collection('submissions').doc(submissionId);

  let submission: FirebaseFirestore.DocumentData;
  try {
    const snap = await submissionRef.get();
    if (!snap.exists) return { error: 'Submission not found.' };
    submission = snap.data()!;
  } catch {
    return { error: 'Could not load this submission. Please try again.' };
  }

  if (submission.status !== 'rejected') {
    return { error: 'Only rejected submissions can be sent a rejection email. Reject this proposal first.' };
  }

  const sentAt = new Date();

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `GDG Sydney <${process.env.RESEND_FROM_EMAIL}>`,
      to: submission.email,
      bcc: 'hello@gdgsydney.com',
      // The email invites a reply about presenting at a meetup, so replies need to land
      // somewhere an organiser reads.
      replyTo: 'hello@gdgsydney.com',
      subject: rejectionEmailSubject(submission.talkTitle),
      html: buildRejectionEmail({
        name: submission.name,
        talkTitle: submission.talkTitle,
      }),
    });
  } catch (err) {
    console.error('Rejection email failed for submission:', submissionId, err);
    return { error: 'We couldn\'t send the rejection email. Please try again in a moment.' };
  }

  try {
    await submissionRef.update({
      rejectionEmailSentAt: Timestamp.fromDate(sentAt),
      rejectionEmailSentBy: senderEmail,
      reviewerNotes: FieldValue.arrayUnion({
        text: `Rejection email sent by ${senderName}.`,
        authorName: senderName,
        createdAt: Timestamp.now(),
      }),
    });
  } catch {
    return {
      error: 'The email was sent, but we couldn\'t record it against this submission. Please refresh before sending again.',
      emailSent: true,
    };
  }

  revalidatePath('/admin');
  return {};
}
