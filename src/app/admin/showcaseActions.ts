'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminSession } from '@/lib/adminSession';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { Resend } from 'resend';
import type { CoPresenter, ShowcaseStage } from '@/lib/types';
import { buildShowcaseAcceptanceEmail, showcaseAcceptanceEmailSubject } from '@/lib/showcaseAcceptanceEmail';
import { showcaseConfirmDeadlineFrom, showcaseConfirmUrl } from '@/lib/showcaseConfirm';
import { buildShowcaseTicketEmail, showcaseTicketEmailSubject } from '@/lib/showcaseTicketEmail';

async function setShowcaseStatus(
  entryId: string,
  status: 'pending' | 'accepted' | 'rejected' | 'archived',
  failureMessage: string
): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    await adminDb.collection('showcase').doc(entryId).update({ status });
    revalidatePath('/admin/showcase');
    return {};
  } catch {
    return { error: failureMessage };
  }
}

export async function acceptShowcaseEntry(entryId: string): Promise<{ error?: string }> {
  return setShowcaseStatus(entryId, 'accepted', 'Could not accept this demo. Please try again.');
}

export async function rejectShowcaseEntry(entryId: string): Promise<{ error?: string }> {
  return setShowcaseStatus(entryId, 'rejected', 'Could not reject this demo. Please try again.');
}

export async function restoreShowcaseEntry(entryId: string): Promise<{ error?: string }> {
  return setShowcaseStatus(entryId, 'pending', 'Could not restore this demo. Please try again.');
}

export async function archiveShowcaseEntry(entryId: string): Promise<{ error?: string }> {
  return setShowcaseStatus(entryId, 'archived', 'Could not archive this demo. Please try again.');
}

export async function addShowcaseReviewerNote(entryId: string, text: string): Promise<{ error?: string }> {
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
    const entryRef = adminDb.collection('showcase').doc(entryId);
    const snap = await entryRef.get();
    if (!snap.exists) return { error: 'Showcase entry not found.' };

    await entryRef.update({
      reviewerNotes: FieldValue.arrayUnion({
        text: trimmed,
        authorName,
        createdAt: Timestamp.now(),
      }),
    });

    revalidatePath('/admin/showcase');
    return {};
  } catch {
    return { error: 'Could not save this note. Please try again.' };
  }
}

// The same limits /api/submit-showcase enforces on a public entry, re-applied here: the
// Admin SDK bypasses firestore.rules, and an entry edited in the dashboard should be
// indistinguishable from one that arrived through the form.
const SHOWCASE_STAGES: ShowcaseStage[] = ['idea', 'prototype', 'live'];
const PROJECT_NAME_MAX = 120;
const PITCH_MAX = 140;
const DESCRIPTION_MAX = 1000;
const BUILT_WITH_MAX = 300;
const CO_PRESENTERS_MAX = 4;
const CO_PRESENTER_NAME_MAX = 100;
const CO_PRESENTER_EMAIL_MAX = 200;
const DEMO_REQUIREMENTS_MAX = 500;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Link tracking is deliberately not editable: it records how the entrant reached the
// form, so rewriting it would only make the analytics lie.
export interface ShowcaseEditableFields {
  name: string;
  email: string;
  projectName: string;
  pitch: string;
  description: string;
  stage: ShowcaseStage;
  demoUrl: string;
  repoUrl: string;
  linkedinUrl: string;
  builtWith: string;
  coPresenters: CoPresenter[];
  demoRequirements: string;
  isFirstTimePresenter: boolean;
}

function validateShowcaseFields(
  fields: ShowcaseEditableFields
): { error: string } | { values: ShowcaseEditableFields } {
  const name = fields.name.trim();
  const email = fields.email.trim().toLowerCase();
  const projectName = fields.projectName.trim();
  const pitch = fields.pitch.trim();
  const description = fields.description.trim();
  const builtWith = fields.builtWith.trim();
  const demoRequirements = fields.demoRequirements.trim();

  if (!name || !projectName || !pitch || !description) {
    return { error: 'Name, project name, pitch, and what they\'ll demo can\'t be empty.' };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { error: 'Please enter a valid email address.' };
  }
  if (projectName.length > PROJECT_NAME_MAX) {
    return { error: `The project name must be ${PROJECT_NAME_MAX} characters or fewer.` };
  }
  if (pitch.length > PITCH_MAX) {
    return { error: `The one-line pitch must be ${PITCH_MAX} characters or fewer.` };
  }
  if (description.length > DESCRIPTION_MAX) {
    return { error: `The description must be ${DESCRIPTION_MAX} characters or fewer.` };
  }
  if (builtWith.length > BUILT_WITH_MAX) {
    return { error: `What it was built with must be ${BUILT_WITH_MAX} characters or fewer.` };
  }
  if (demoRequirements.length > DEMO_REQUIREMENTS_MAX) {
    return { error: `What they need on the day must be ${DEMO_REQUIREMENTS_MAX} characters or fewer.` };
  }
  if (!SHOWCASE_STAGES.includes(fields.stage)) {
    return { error: 'Please select a valid project stage.' };
  }

  // Blank rows are dropped rather than rejected, matching the public endpoint: a row
  // added and then left empty is a slip, not something to block the save on.
  const coPresenters: CoPresenter[] = [];
  for (const raw of fields.coPresenters) {
    const coPresenterName = raw.name.trim();
    const coPresenterEmail = raw.email.trim().toLowerCase();
    if (!coPresenterName && !coPresenterEmail) continue;
    if (!coPresenterName) return { error: 'Please give every co-presenter a name.' };
    if (coPresenterName.length > CO_PRESENTER_NAME_MAX) {
      return { error: `A co-presenter's name must be ${CO_PRESENTER_NAME_MAX} characters or fewer.` };
    }
    if (coPresenterEmail) {
      if (coPresenterEmail.length > CO_PRESENTER_EMAIL_MAX) {
        return { error: `A co-presenter's email must be ${CO_PRESENTER_EMAIL_MAX} characters or fewer.` };
      }
      if (!EMAIL_PATTERN.test(coPresenterEmail)) {
        return { error: `${coPresenterName} needs a valid email address, or leave it blank.` };
      }
    }
    coPresenters.push({ name: coPresenterName, email: coPresenterEmail });
  }
  if (coPresenters.length > CO_PRESENTERS_MAX) {
    return { error: `An entry can have up to ${CO_PRESENTERS_MAX} co-presenters.` };
  }

  return {
    values: {
      name,
      email,
      projectName,
      pitch,
      description,
      stage: fields.stage,
      demoUrl: fields.demoUrl.trim(),
      repoUrl: fields.repoUrl.trim(),
      linkedinUrl: fields.linkedinUrl.trim(),
      builtWith,
      coPresenters,
      demoRequirements,
      isFirstTimePresenter: fields.isFirstTimePresenter,
    },
  };
}

export async function updateShowcaseEntry(
  entryId: string,
  fields: ShowcaseEditableFields
): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const validated = validateShowcaseFields(fields);
  if ('error' in validated) return { error: validated.error };

  try {
    const entryRef = adminDb.collection('showcase').doc(entryId);
    const snap = await entryRef.get();
    if (!snap.exists) return { error: 'Showcase entry not found.' };

    await entryRef.update({ ...validated.values });

    revalidatePath('/admin/showcase');
    return {};
  } catch {
    return { error: 'Could not save these changes. Please try again.' };
  }
}

// Tells an accepted entrant their demo is in, and asks them to confirm. A separate,
// explicit step from accepting, as with speakers and volunteers: accepting is a decision,
// emailing is telling someone about it, and an admin should choose when.
export async function sendShowcaseAcceptanceEmail(entryId: string): Promise<{ error?: string }> {
  let senderName: string;
  let senderEmail: string;
  try {
    ({ name: senderName, email: senderEmail } = await verifyAdminSession());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const entryRef = adminDb.collection('showcase').doc(entryId);

  let entry: FirebaseFirestore.DocumentData;
  try {
    const snap = await entryRef.get();
    if (!snap.exists) return { error: 'Showcase entry not found.' };
    entry = snap.data()!;
  } catch {
    return { error: 'Could not load this showcase entry. Please try again.' };
  }

  if (entry.status !== 'accepted') {
    return { error: 'Only accepted demos can be sent an acceptance email. Accept this entry first.' };
  }

  const sentAt = new Date();
  const confirmBy = showcaseConfirmDeadlineFrom(sentAt);

  let confirmLink: string;
  try {
    confirmLink = showcaseConfirmUrl(entryId);
  } catch {
    // Thrown when SHOWCASE_CONFIRM_SECRET is missing. An acceptance email with a dead
    // confirm button would be worse than not sending it at all.
    return { error: 'The showcase confirmation link isn\'t configured on the server, so this email can\'t be sent yet.' };
  }

  const coPresenterNames = ((entry.coPresenters ?? []) as Array<{ name?: string }>)
    .map((coPresenter) => coPresenter.name?.trim() ?? '')
    .filter(Boolean);

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `GDG Sydney <${process.env.RESEND_FROM_EMAIL}>`,
      to: entry.email,
      bcc: 'hello@gdgsydney.com',
      replyTo: 'hello@gdgsydney.com',
      subject: showcaseAcceptanceEmailSubject(entry.projectName),
      html: buildShowcaseAcceptanceEmail({
        name: entry.name,
        projectName: entry.projectName,
        stage: entry.stage ?? 'prototype',
        coPresenterNames,
        confirmUrl: confirmLink,
        confirmByIso: confirmBy.toISOString(),
      }),
    });
  } catch (err) {
    // Unlike the public form, this failure is surfaced: the admin is standing right there
    // and needs to know the entrant was never told.
    console.error('Showcase acceptance email failed for entry:', entryId, err);
    return { error: 'We couldn\'t send the acceptance email. Please try again in a moment.' };
  }

  try {
    await entryRef.update({
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
    // a send failure: resending would email the entrant twice.
    return { error: 'The email was sent, but we couldn\'t record it against this entry. Please refresh before sending again.' };
  }

  revalidatePath('/admin/showcase');
  return {};
}

// The complimentary showcase ticket, sent once the entrant has confirmed. Gated on the
// confirmation rather than the acceptance, as with speakers: the link unlocks a free
// ticket. The confirm page shows the same link, so this is for entrants who confirmed
// before it did, or who want it in their inbox.
export async function sendShowcaseTicketEmail(entryId: string): Promise<{ error?: string }> {
  let senderName: string;
  let senderEmail: string;
  try {
    ({ name: senderName, email: senderEmail } = await verifyAdminSession());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const ticketUrl = process.env.SHOWCASE_TICKET_URL?.trim();
  if (!ticketUrl) {
    return { error: 'The showcase ticket link isn\'t configured on the server, so this email can\'t be sent yet.' };
  }

  const entryRef = adminDb.collection('showcase').doc(entryId);

  let entry: FirebaseFirestore.DocumentData;
  try {
    const snap = await entryRef.get();
    if (!snap.exists) return { error: 'Showcase entry not found.' };
    entry = snap.data()!;
  } catch {
    return { error: 'Could not load this showcase entry. Please try again.' };
  }

  if (entry.status !== 'accepted') {
    return { error: 'Only accepted demos can be sent a showcase ticket. Accept this entry first.' };
  }
  if (!entry.showcaseConfirmedAt) {
    return { error: 'This entrant hasn\'t confirmed their demo yet, so the ticket can\'t be sent.' };
  }

  const coPresenterNames = ((entry.coPresenters ?? []) as Array<{ name?: string }>)
    .map((coPresenter) => coPresenter.name?.trim() ?? '')
    .filter(Boolean);

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `GDG Sydney <${process.env.RESEND_FROM_EMAIL}>`,
      to: entry.email,
      bcc: 'hello@gdgsydney.com',
      replyTo: 'hello@gdgsydney.com',
      subject: showcaseTicketEmailSubject(),
      html: buildShowcaseTicketEmail({
        name: entry.name,
        projectName: entry.projectName,
        coPresenterNames,
        ticketUrl,
      }),
    });
  } catch (err) {
    console.error('Showcase ticket email failed for entry:', entryId, err);
    return { error: 'We couldn\'t send the showcase ticket email. Please try again in a moment.' };
  }

  try {
    await entryRef.update({
      showcaseTicketEmailSentAt: Timestamp.now(),
      showcaseTicketEmailSentBy: senderEmail,
      reviewerNotes: FieldValue.arrayUnion({
        text: `Showcase ticket link emailed by ${senderName}.`,
        authorName: senderName,
        createdAt: Timestamp.now(),
      }),
    });
  } catch {
    // The email is already gone, so resending would mail the entrant twice.
    return { error: 'The ticket email was sent, but we couldn\'t record it against this entry. Please refresh before sending again.' };
  }

  revalidatePath('/admin/showcase');
  return {};
}
