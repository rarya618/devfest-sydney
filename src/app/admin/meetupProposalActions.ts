'use server';

import { revalidatePath } from 'next/cache';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminSession } from '@/lib/adminSession';
import { Resend } from 'resend';
import { loadEvent, hasEventEnded } from '@/lib/events';
import { toEventCopy } from '@/lib/eventCopy';
import { findOrCreatePerson, removePeopleWithoutTalks } from '@/lib/people';
import { normaliseProfileUrl } from '@/lib/speakers';
import { EMAIL_PATTERN } from '@/lib/emailPattern';
import { confirmDeadlineFrom, confirmUrl } from '@/lib/speakerConfirm';
import { acceptanceEmailSubject, buildAcceptanceEmail } from '@/lib/acceptanceEmail';
import { editMeetupProposal, MEETUP_TO_TALK_FORMAT } from '@/lib/proposalFiling';
import type { MeetupFormat, MeetupProposalStatus } from '@/lib/types';

// Review of /speak proposals for general events. Stage 4f: accepting one files it under a
// general event and makes it a talk (talks/{proposal id}) given by a person (`speakers`), the
// same shape a DevFest talk has; the acceptance email and /speaker/confirm then work as they
// do for DevFest. Moving an accepted proposal back (to pending, rejected or archived) takes
// its talk away again, as Undo does on the DevFest submissions page.

// The acceptance fields, cleared with the talk so a later re-acceptance starts from scratch.
const ACCEPTANCE_RESET = {
  eventId: FieldValue.delete(),
  acceptanceEmailSentAt: FieldValue.delete(),
  acceptanceEmailSentBy: FieldValue.delete(),
  confirmByDate: FieldValue.delete(),
  speakerConfirmedAt: FieldValue.delete(),
};

async function setMeetupProposalStatus(
  proposalId: string,
  status: Exclude<MeetupProposalStatus, 'accepted'>,
  failureMessage: string
): Promise<{ error?: string }> {
  let reviewerName: string;
  try {
    ({ name: reviewerName } = await verifyAdminSession());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    const proposalRef = adminDb.collection('meetupProposals').doc(proposalId);
    const proposal = await proposalRef.get();
    if (!proposal.exists) return { error: 'This proposal no longer exists.' };
    const wasAccepted = proposal.data()?.status === 'accepted';

    const talkRef = adminDb.collection('talks').doc(proposalId);
    const talk = wasAccepted ? await talkRef.get() : null;
    const speakerIds = ((talk?.data()?.speakerIds ?? []) as string[]);

    const batch = adminDb.batch();
    batch.update(proposalRef, {
      status,
      statusChangedAt: FieldValue.serverTimestamp(),
      statusChangedBy: reviewerName,
      ...(wasAccepted ? ACCEPTANCE_RESET : {}),
    });
    if (talk?.exists) batch.delete(talkRef);
    await batch.commit();
    if (speakerIds.length > 0) await removePeopleWithoutTalks(speakerIds);

    revalidateMeetupPages();
    return {};
  } catch {
    return { error: failureMessage };
  }
}

function revalidateMeetupPages() {
  revalidatePath('/admin/meetups');
  revalidatePath('/admin/people');
}

// /speak asks for one "LinkedIn or website" link; a LinkedIn address goes where the profile
// shows LinkedIn, anything else is their website.
function profileLinksFrom(profileUrl: string): { linkedinUrl: string; websiteUrl: string } {
  const url = normaliseProfileUrl(profileUrl ?? '');
  return /(^|\.)linkedin\.com\//i.test(url.replace(/^https?:\/\//, '')) ? { linkedinUrl: url, websiteUrl: '' } : { linkedinUrl: '', websiteUrl: url };
}


// Accepts a proposal into a general event: the talk is created under that event, given by the
// proposer (an existing person is reused when the name and email both match). Nothing is
// emailed: the acceptance email is its own step, from the envelope on the card.
export async function acceptMeetupProposal(proposalId: string, eventId: string): Promise<{ error?: string }> {
  let reviewerName: string;
  try {
    ({ name: reviewerName } = await verifyAdminSession());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    const [proposalSnapshot, event] = await Promise.all([
      adminDb.collection('meetupProposals').doc(proposalId).get(),
      loadEvent(eventId),
    ]);
    if (!proposalSnapshot.exists) return { error: 'This proposal no longer exists.' };
    if (!event || event.type !== 'general') return { error: 'Choose a general event for this talk.' };
    if (hasEventEnded(event)) return { error: `${event.name} has already happened. Choose an upcoming event.` };
    const proposal = proposalSnapshot.data()!;
    if (proposal.status === 'accepted') return { error: 'This proposal is already accepted. Move it back to pending to choose another event.' };

    const talkRef = adminDb.collection('talks').doc(proposalId);
    if ((await talkRef.get()).exists) return { error: 'This proposal already has a talk. Refresh the page.' };

    const personId = await findOrCreatePerson({
      name: String(proposal.name ?? ''),
      email: String(proposal.email ?? ''),
      ...profileLinksFrom(String(proposal.profileUrl ?? '')),
      githubUrl: '',
      bio: String(proposal.bio ?? ''),
      tagline: '',
      photoUrl: '',
    });

    const batch = adminDb.batch();
    batch.create(talkRef, {
      eventId: event.id,
      talkTitle: proposal.talkTitle ?? '',
      abstract: proposal.abstract ?? '',
      format: MEETUP_TO_TALK_FORMAT[proposal.format as MeetupFormat] ?? 'talk',
      // A general event has no tracks or levels. These only fill the shape a talk has: the
      // acceptance email and public lineup of a general event don't show them.
      track: 'developer',
      experienceLevel: 'intermediate',
      speakerIds: [personId],
      meetupProposalId: proposalId,
      submissionId: '',
      promotedAt: FieldValue.serverTimestamp(),
      speakerState: {},
    });
    batch.update(proposalSnapshot.ref, {
      status: 'accepted',
      eventId: event.id,
      statusChangedAt: FieldValue.serverTimestamp(),
      statusChangedBy: reviewerName,
    });
    await batch.commit();

    revalidateMeetupPages();
    return {};
  } catch {
    return { error: 'Could not accept this proposal. Please try again.' };
  }
}

// The acceptance email, worded for the meetup the talk is in (stage 4e), with the same
// confirm link a DevFest speaker gets. Records when it went, who sent it and the deadline, and
// adds a reviewer note, as sendAcceptanceEmail does for DevFest proposals.
export async function sendMeetupAcceptanceEmail(proposalId: string): Promise<{ error?: string }> {
  let senderName: string;
  let senderEmail: string;
  try {
    ({ name: senderName, email: senderEmail } = await verifyAdminSession());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const proposalRef = adminDb.collection('meetupProposals').doc(proposalId);
  let proposal: FirebaseFirestore.DocumentData;
  let talk: FirebaseFirestore.DocumentData | undefined;
  let speaker: FirebaseFirestore.DocumentData | undefined;
  let event;
  try {
    const snapshot = await proposalRef.get();
    if (!snapshot.exists) return { error: 'This proposal no longer exists.' };
    proposal = snapshot.data()!;
    if (proposal.status !== 'accepted') return { error: 'Accept this proposal into an event before emailing the speaker.' };
    talk = (await adminDb.collection('talks').doc(proposalId).get()).data();
    const leadId = ((talk?.speakerIds ?? []) as string[])[0];
    if (leadId) speaker = (await adminDb.collection('speakers').doc(leadId).get()).data();
    event = await loadEvent(String(proposal.eventId ?? ''));
  } catch {
    return { error: 'Could not load this proposal. Please try again.' };
  }
  if (!talk || !event) return { error: 'This talk or its event is missing. Move the proposal back to pending and accept it again.' };

  // The person's current name and address if their profile has been edited since.
  const name = String(speaker?.name ?? proposal.name ?? '');
  const email = String(speaker?.email ?? proposal.email ?? '').trim();
  if (!EMAIL_PATTERN.test(email)) return { error: 'The speaker\'s email address doesn\'t look right. Fix it on All speakers first.' };

  let confirmLink: string;
  try {
    confirmLink = confirmUrl(proposalId);
  } catch {
    return { error: 'The speaker confirmation link isn\'t configured on the server, so this email can\'t be sent yet.' };
  }

  const sentAt = new Date();
  const confirmBy = confirmDeadlineFrom(sentAt);
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: `GDG Sydney <${process.env.RESEND_FROM_EMAIL}>`,
      to: email,
      bcc: 'hello@gdgsydney.com',
      replyTo: 'hello@gdgsydney.com',
      subject: acceptanceEmailSubject(String(talk.talkTitle ?? ''), toEventCopy(event)),
      html: buildAcceptanceEmail({
        name,
        talkTitle: String(talk.talkTitle ?? ''),
        format: talk.format ?? 'talk',
        track: talk.track ?? 'developer',
        experienceLevel: talk.experienceLevel ?? 'intermediate',
        confirmUrl: confirmLink,
        confirmByIso: confirmBy.toISOString(),
        publicTicketUrl: event.humanitixUrl,
        event: toEventCopy(event),
      }),
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    console.error('Meetup acceptance email failed for proposal:', proposalId, err);
    return { error: 'We couldn\'t send the acceptance email. Please try again in a moment.' };
  }

  try {
    await proposalRef.update({
      acceptanceEmailSentAt: Timestamp.fromDate(sentAt),
      acceptanceEmailSentBy: senderEmail,
      confirmByDate: Timestamp.fromDate(confirmBy),
      reviewerNotes: FieldValue.arrayUnion({
        text: `Acceptance email for ${event.name} sent by ${senderName}.`,
        authorName: senderName,
        createdAt: Timestamp.now(),
      }),
    });
  } catch {
    return { error: 'The email was sent, but we couldn\'t record it. Refresh before sending again.' };
  }

  revalidateMeetupPages();
  return {};
}

export async function rejectMeetupProposal(proposalId: string): Promise<{ error?: string }> {
  return setMeetupProposalStatus(proposalId, 'rejected', 'Could not reject this proposal. Please try again.');
}

export async function restoreMeetupProposal(proposalId: string): Promise<{ error?: string }> {
  return setMeetupProposalStatus(proposalId, 'pending', 'Could not move this proposal back to pending. Please try again.');
}

export async function archiveMeetupProposal(proposalId: string): Promise<{ error?: string }> {
  return setMeetupProposalStatus(proposalId, 'archived', 'Could not archive this proposal. Please try again.');
}

export async function addMeetupReviewerNote(proposalId: string, text: string): Promise<{ error?: string }> {
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
    const proposalRef = adminDb.collection('meetupProposals').doc(proposalId);
    const snapshot = await proposalRef.get();
    if (!snapshot.exists) return { error: 'This proposal no longer exists.' };

    await proposalRef.update({
      reviewerNotes: FieldValue.arrayUnion({ text: trimmed, authorName, createdAt: Timestamp.now() }),
    });
    revalidateMeetupPages();
    return {};
  } catch {
    return { error: 'Could not save this note. Please try again.' };
  }
}

// An organiser's edit from the card's More menu: the same fields a speaker can change (not the
// name or email, which belong to the person), written to the proposal and, once accepted, to
// its talk. Allowed at any status and any time; it doesn't mark the proposal as edited, since
// that mark tells organisers the speaker changed something.
export async function updateMeetupProposal(proposalId: string, fields: Record<string, unknown>): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    const result = await editMeetupProposal(proposalId, fields, { kind: 'organiser' });
    if (result.outcome === 'invalid') return { error: result.message };
    if (result.outcome === 'not-found') return { error: 'This proposal no longer exists.' };
    revalidateMeetupPages();
    revalidatePath('/speaker', 'layout');
    return {};
  } catch (error) {
    console.error('Meetup proposal edit failed:', error);
    return { error: 'Could not save these changes. Please try again.' };
  }
}
