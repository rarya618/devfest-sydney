'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { Resend } from 'resend';
import { buildSpeakerConfirmedNotice } from '@/lib/acceptanceEmail';
import { verifySpeakerConfirmToken } from '@/lib/speakerConfirm';
import { fetchEventLink, loadEvent } from '@/lib/events';
import { loadSpeakerProposal } from '@/lib/speakerProposals';

const ORGANISER_INBOX = 'hello@gdgsydney.com';

// Tells the organisers a slot is settled. Deliberately not awaited on the critical path in
// a way that could fail the confirmation: the speaker has already done their part, and an
// email problem is ours, not theirs.
async function notifyOrganisers(proposalId: string, submission: FirebaseFirestore.DocumentData, confirmedAt: Date) {
  try {
    const event = await loadEvent(String(submission.eventId ?? '')).catch(() => null);
    // Track and format from the talk, which both kinds of proposal have once accepted (a
    // meetup proposal has no track of its own).
    const talk = (await adminDb.collection('talks').doc(proposalId).get()).data();
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `GDG Sydney <${process.env.RESEND_FROM_EMAIL}>`,
      to: ORGANISER_INBOX,
      // So an organiser can reply straight to the speaker from the notification.
      replyTo: submission.email,
      subject: `Speaker confirmed: ${submission.name} - ${submission.talkTitle}`,
      html: buildSpeakerConfirmedNotice({
        name: submission.name,
        email: submission.email,
        talkTitle: submission.talkTitle,
        track: talk?.track ?? submission.track ?? 'developer',
        format: talk?.format ?? submission.format ?? 'talk',
        confirmedAtIso: confirmedAt.toISOString(),
        eventName: event?.name ?? 'the event',
      }),
    });
  } catch (err) {
    console.error('Organiser confirmation notice failed for submission:', submission.email, err);
  }
}

interface ConfirmResult {
  error?: string;
  // The speaker ticket link, returned only on a successful confirmation. It rides back on
  // the action rather than being rendered into the page up front, so the access code never
  // reaches the browser of someone who hasn't answered yet. Null when SPEAKER_TICKET_URL
  // isn't configured, which the page treats as "we'll email it" rather than as a failure.
  ticketUrl?: string | null;
}

// The speaker has no session, so the signed token in the link is the only credential.
// Confirming is behind a button rather than the page load itself: mail scanners and link
// previewers fetch URLs on their own, and a GET that writes would confirm for them.
export async function confirmSpeakerParticipation(token: string): Promise<ConfirmResult> {
  const submissionId = verifySpeakerConfirmToken(token);
  if (!submissionId) {
    return { error: 'This confirmation link isn\'t valid. Please reply to your acceptance email and we\'ll sort it out.' };
  }

  try {
    // A DevFest proposal or a meetup one (stage 4f): the same token, the same fields.
    const proposal = await loadSpeakerProposal(submissionId);
    if (!proposal || proposal.data.status !== 'accepted') {
      return { error: 'This confirmation link is no longer active. Please reply to your acceptance email and we\'ll sort it out.' };
    }

    // A speaker clicking twice shouldn't move the date we recorded, shouldn't error at
    // them, and shouldn't email the organisers a second time.
    if (!proposal.data.speakerConfirmedAt) {
      const confirmedAt = new Date();
      await proposal.ref.update({ speakerConfirmedAt: Timestamp.fromDate(confirmedAt) });
      await notifyOrganisers(submissionId, proposal.data, confirmedAt);
    }

    // The proposal's own event's ticket link (stage 4e), not whichever DevFest is current.
    return { ticketUrl: await fetchEventLink(String(proposal.data.eventId ?? ''), 'speakerTicketUrl') };
  } catch {
    return { error: 'We couldn\'t record your confirmation just now. Please try again in a moment.' };
  }
}
