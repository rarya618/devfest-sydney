'use server';

import { Timestamp } from 'firebase-admin/firestore';
import { Resend } from 'resend';
import { buildVolunteerConfirmedNotice } from '@/lib/volunteerAcceptanceEmail';
import { verifyVolunteerConfirmToken } from '@/lib/volunteerConfirm';
import type { VolunteerLinks } from './VolunteerNextSteps';
import { fetchEventLink, loadEvent } from '@/lib/events';
import { loadVolunteerRecord } from '@/lib/volunteerProfiles';

const ORGANISER_INBOX = 'hello@gdgsydney.com';

// Tells the organisers a crew spot is settled. A failure here is logged rather than
// surfaced: the volunteer has already done their part, and an email problem is ours.
async function notifyOrganisers(volunteer: FirebaseFirestore.DocumentData, confirmedAt: Date) {
  try {
    const event = await loadEvent(String(volunteer.eventId ?? '')).catch(() => null);
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `GDG Sydney <${process.env.RESEND_FROM_EMAIL}>`,
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
        eventName: event?.name ?? 'the event',
      }),
    });
  } catch (err) {
    console.error('Organiser volunteer confirmation notice failed for:', volunteer.email, err);
  }
}

interface ConfirmResult {
  error?: string;
  // Returned only on a successful confirmation rather than rendered into the page up
  // front, so the ticket access code and the group invite never reach the browser of
  // someone who hasn't answered yet.
  links?: VolunteerLinks;
}

// The volunteer has no session, so the signed token in the link is the only credential.
// Confirming is behind a button rather than the page load itself: mail scanners and link
// previewers fetch URLs on their own, and a GET that writes would confirm for them.
export async function confirmVolunteering(token: string): Promise<ConfirmResult> {
  const volunteerId = verifyVolunteerConfirmToken(token);
  if (!volunteerId) {
    return { error: 'This confirmation link isn\'t valid. Please reply to your acceptance email and we\'ll sort it out.' };
  }

  try {
    // With the person's current details from their profile (stage 4d), for the notice.
    const record = await loadVolunteerRecord(volunteerId);
    if (!record || record.data.status !== 'accepted') {
      return { error: 'This confirmation link is no longer active. Please reply to your acceptance email and we\'ll sort it out.' };
    }

    // A volunteer clicking twice shouldn't move the date we recorded, shouldn't error at
    // them, and shouldn't email the organisers a second time.
    if (!record.data.volunteerConfirmedAt) {
      const confirmedAt = new Date();
      await record.ref.update({ volunteerConfirmedAt: Timestamp.fromDate(confirmedAt) });
      await notifyOrganisers(record.data, confirmedAt);
    }

    // Marked by an admin on /admin/devfest/crew once the ticket has gone out some other way.
    const ticketAlreadySent = Boolean(record.data.ticketSentAt);
    // The links of the event they signed up for (stage 4e), not whichever DevFest is current.
    const eventId = String(record.data.eventId ?? '');
    return {
      links: {
        ticketUrl: ticketAlreadySent ? null : await fetchEventLink(eventId, 'volunteerTicketUrl'),
        ticketAlreadySent,
        whatsappUrl: await fetchEventLink(eventId, 'volunteerWhatsappUrl'),
      },
    };
  } catch {
    return { error: 'We couldn\'t record your confirmation just now. Please try again in a moment.' };
  }
}
