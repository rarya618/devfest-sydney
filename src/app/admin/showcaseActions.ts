'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminSession } from '@/lib/adminSession';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { CoPresenter, ShowcaseStage } from '@/lib/types';

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
