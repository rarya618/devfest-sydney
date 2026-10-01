'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { Resend } from 'resend';
import { buildShowcaseConfirmedNotice } from '@/lib/showcaseAcceptanceEmail';
import { verifyShowcaseConfirmToken } from '@/lib/showcaseConfirm';

const ORGANISER_INBOX = 'hello@gdgsydney.com';

// Tells the organisers a showcase slot is settled. A failure here is logged rather than
// surfaced: the entrant has already done their part, and an email problem is ours.
async function notifyOrganisers(entry: FirebaseFirestore.DocumentData, confirmedAt: Date) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `DevFest Sydney <${process.env.RESEND_FROM_EMAIL}>`,
      to: ORGANISER_INBOX,
      // So an organiser can reply straight to the entrant from the notification.
      replyTo: entry.email,
      subject: `Showcase demo confirmed: ${entry.projectName}`,
      html: buildShowcaseConfirmedNotice({
        name: entry.name,
        email: entry.email,
        projectName: entry.projectName,
        coPresenterNames: ((entry.coPresenters ?? []) as Array<{ name?: string }>)
          .map((coPresenter) => coPresenter.name?.trim() ?? '')
          .filter(Boolean),
        demoRequirements: entry.demoRequirements ?? '',
        confirmedAtIso: confirmedAt.toISOString(),
      }),
    });
  } catch (err) {
    console.error('Organiser showcase confirmation notice failed for:', entry.email, err);
  }
}

// The entrant has no session, so the signed token in the link is the only credential.
// Confirming is behind a button rather than the page load itself: mail scanners and link
// previewers fetch URLs on their own, and a GET that writes would confirm for them.
interface ConfirmResult {
  error?: string;
  // The showcase ticket link, returned only on a successful confirmation. It rides back on
  // the action rather than being rendered into the page up front, so the access code never
  // reaches the browser of someone who hasn't answered yet. Null when SHOWCASE_TICKET_URL
  // isn't configured, which the page treats as "we'll email it" rather than as a failure.
  ticketUrl?: string | null;
  hasCoPresenters?: boolean;
}

export async function confirmShowcaseDemo(token: string): Promise<ConfirmResult> {
  const entryId = verifyShowcaseConfirmToken(token);
  if (!entryId) {
    return { error: 'This confirmation link isn\'t valid. Please reply to your acceptance email and we\'ll sort it out.' };
  }

  try {
    const entryRef = adminDb.collection('showcase').doc(entryId);
    const snap = await entryRef.get();
    if (!snap.exists || snap.data()?.status !== 'accepted') {
      return { error: 'This confirmation link is no longer active. Please reply to your acceptance email and we\'ll sort it out.' };
    }

    // An entrant clicking twice shouldn't move the date we recorded, shouldn't error at
    // them, and shouldn't email the organisers a second time.
    if (!snap.data()?.showcaseConfirmedAt) {
      const confirmedAt = new Date();
      await entryRef.update({ showcaseConfirmedAt: Timestamp.fromDate(confirmedAt) });
      await notifyOrganisers(snap.data()!, confirmedAt);
    }

    return {
      ticketUrl: process.env.SHOWCASE_TICKET_URL?.trim() || null,
      hasCoPresenters: (snap.data()?.coPresenters ?? []).length > 0,
    };
  } catch {
    return { error: 'We couldn\'t record your confirmation just now. Please try again in a moment.' };
  }
}
