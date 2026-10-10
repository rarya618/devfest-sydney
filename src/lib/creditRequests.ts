import { createHash } from 'node:crypto';
import { adminDb } from '@/lib/firebase-admin';
import type { Timestamp } from 'firebase-admin/firestore';
import { fetchPublicSchedule, formatScheduleTime } from '@/lib/schedule';
import { EMAIL_PATTERN } from '@/lib/jobBoardLabels';
import {
  CREDIT_REQUEST_NAME_LIMIT,
  CREDIT_REQUEST_NOTE_LIMIT,
  type CreditWorkshopOption,
} from '@/lib/creditRequestLabels';
import type { CreditRequest } from '@/lib/types';

export type CreditRequestFields = Omit<CreditRequest, 'id' | 'submittedAt'>;

// The workshops credits are being offered for, by schedule slot id: only Shang Yi Lim's
// ran into trouble on the day. Add a slot here if another one does, and the form turns
// into a choice between them.
const CREDIT_WORKSHOP_SLOT_IDS = ['1400-workshops'];

export async function fetchCreditWorkshopOptions(): Promise<CreditWorkshopOption[]> {
  const schedule = await fetchPublicSchedule();
  return schedule
    .filter((slot) => CREDIT_WORKSHOP_SLOT_IDS.includes(slot.id) && slot.format === 'workshop')
    .map((slot) => ({
      id: slot.id,
      label: `${formatScheduleTime(slot.startTime)} · ${slot.title} · ${slot.speakers.map((speaker) => speaker.name).join(', ')}`,
    }));
}

// One request per person per workshop. The document id is derived from both, so a second
// submit (a double tap, or the QR scanned twice) lands on the same document rather than
// putting someone on the list twice.
export function creditRequestId(workshopSlotId: string, email: string): string {
  return createHash('sha256').update(`${workshopSlotId}:${email}`).digest('hex').slice(0, 32);
}

// For /api/submit-credit-request. The Admin SDK bypasses firestore.rules, so this is the
// only check there is.
export async function validateCreditRequest(body: unknown): Promise<CreditRequestFields> {
  if (!body || typeof body !== 'object') throw new Error('Invalid request body.');
  const input = body as Record<string, unknown>;

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) throw new Error('Please enter your name.');
  if (name.length > CREDIT_REQUEST_NAME_LIMIT) throw new Error(`Your name must be ${CREDIT_REQUEST_NAME_LIMIT} characters or fewer.`);

  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (!EMAIL_PATTERN.test(email)) throw new Error('Please enter a valid email address, so we can send your credits.');

  // The title is looked up here rather than trusted from the form, so a request can only
  // name a workshop that is actually on the schedule.
  const workshopSlotId = typeof input.workshopSlotId === 'string' ? input.workshopSlotId : '';
  const workshop = (await fetchCreditWorkshopOptions()).find((option) => option.id === workshopSlotId);
  if (!workshop) throw new Error('Please pick the workshop you were in.');

  const note = typeof input.note === 'string' ? input.note.trim() : '';
  if (note.length > CREDIT_REQUEST_NOTE_LIMIT) throw new Error(`Your note must be ${CREDIT_REQUEST_NOTE_LIMIT} characters or fewer.`);

  return { name, email, workshopSlotId: workshop.id, workshopTitle: workshop.label, note };
}

// For /admin/credits.
export async function fetchCreditRequests(): Promise<CreditRequest[]> {
  const snapshot = await adminDb.collection('creditRequests').orderBy('submittedAt', 'desc').get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const submittedAt = data.submittedAt as Timestamp | undefined;
    return {
      id: doc.id,
      name: data.name ?? '',
      email: data.email ?? '',
      workshopSlotId: data.workshopSlotId ?? '',
      workshopTitle: data.workshopTitle ?? '',
      note: data.note ?? '',
      submittedAt: submittedAt ? submittedAt.toDate().toISOString() : new Date().toISOString(),
    };
  });
}
