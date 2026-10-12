import { createHmac, timingSafeEqual } from 'crypto';
import type { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { EMAIL_PATTERN } from '@/lib/jobBoardLabels';
import {
  EMPTY_SPEAKER_GIFT_FIELDS,
  findSpeakerGiftErrors,
  type SpeakerGiftFormFields,
} from '@/lib/speakerGiftLabels';
import type { SpeakerGift } from '@/lib/types';

// The post-event thank-you links to /speaker/thanks, where a speaker leaves a postal
// address for their mug and a work email for the Asana trial. Like /speaker/confirm there
// is no session, so the link carries the speaker id plus an HMAC of it.
//
// Signed with SPEAKER_CONFIRM_SECRET rather than a secret of its own, so there is no new
// Secret Manager entry to forget before a rollout. The HMAC covers a purpose prefix as
// well as the id, so a confirm token can never pass as a thanks token or the other way
// round. It signs the speaker id, not the submission id, because co-speakers have no
// submission and each gets a mug of their own.
const TOKEN_SEPARATOR = '.';
const TOKEN_PURPOSE = 'speaker-thanks:';

function signature(speakerId: string): string {
  const secret = process.env.SPEAKER_CONFIRM_SECRET;
  if (!secret) throw new Error('SPEAKER_CONFIRM_SECRET is not set.');
  return createHmac('sha256', secret).update(`${TOKEN_PURPOSE}${speakerId}`).digest('base64url');
}

export function createThanksToken(speakerId: string): string {
  return `${Buffer.from(speakerId).toString('base64url')}${TOKEN_SEPARATOR}${signature(speakerId)}`;
}

// The speaker id the token was issued for, or null if it is malformed or not ours.
export function verifyThanksToken(token: string): string | null {
  const [encodedId, providedSignature] = token.split(TOKEN_SEPARATOR);
  if (!encodedId || !providedSignature) return null;

  const speakerId = Buffer.from(encodedId, 'base64url').toString('utf8');
  if (!speakerId) return null;

  const expected = Buffer.from(signature(speakerId));
  const provided = Buffer.from(providedSignature);
  // timingSafeEqual throws on a length mismatch, so that case is checked first.
  if (expected.length !== provided.length) return null;
  return timingSafeEqual(expected, provided) ? speakerId : null;
}

export function thanksUrl(speakerId: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://devfest.gdgsydney.com';
  return `${siteUrl.replace(/\/$/, '')}/speaker/thanks?token=${createThanksToken(speakerId)}`;
}

// The shared Drive folder of event photos, on settings/site alongside the other site
// assets, so it can be set or swapped without a deploy. Null when it hasn't been set.
export async function fetchSpeakerPhotosUrl(): Promise<string | null> {
  const settings = await adminDb.collection('settings').doc('site').get();
  const url = settings.data()?.speakerPhotosUrl;
  return typeof url === 'string' && /^https:\/\//.test(url.trim()) ? url.trim() : null;
}

export interface ThanksRecipient {
  speakerId: string;
  name: string;
  email: string;
}

// The speaker behind a thanks link, or null if they are gone from the lineup or their
// session was never confirmed. A co-speaker counts as confirmed when their lead is, the
// same rule the public pages use. Throws on a failed read, so a caller can tell "not
// eligible" apart from "couldn't check".
export async function loadThanksRecipient(speakerId: string): Promise<ThanksRecipient | null> {
  const speakerSnap = await adminDb.collection('speakers').doc(speakerId).get();
  if (!speakerSnap.exists) return null;
  const speaker = speakerSnap.data()!;

  const sessionOwner = speaker.coSpeakerOf
    ? (await adminDb.collection('speakers').doc(String(speaker.coSpeakerOf)).get()).data()
    : speaker;
  const submissionId = sessionOwner?.submissionId;
  if (!submissionId) return null;
  const submission = (await adminDb.collection('submissions').doc(String(submissionId)).get()).data();
  if (!submission?.speakerConfirmedAt) return null;

  return { speakerId, name: String(speaker.name ?? ''), email: String(speaker.email ?? '').trim() };
}

function readString(input: Record<string, unknown>, key: keyof SpeakerGiftFormFields): string {
  const value = input[key];
  return typeof value === 'string' ? value.trim() : '';
}

// For /api/submit-speaker-gift. Throws the first problem as a plain message, since the
// form has already shown each one beside its field. A half the speaker opted out of is
// saved blank, so turning the mug off on a second visit really does drop the address.
export function validateSpeakerGift(body: unknown): SpeakerGiftFormFields {
  if (!body || typeof body !== 'object') throw new Error('Invalid request body.');
  const input = body as Record<string, unknown>;

  const wantsMug = input.wantsMug === true;
  const wantsAsanaTrial = input.wantsAsanaTrial === true;
  const fields: SpeakerGiftFormFields = {
    ...EMPTY_SPEAKER_GIFT_FIELDS,
    country: '',
    wantsMug,
    wantsAsanaTrial,
    asanaConsent: false,
  };

  if (wantsMug) {
    fields.recipientName = readString(input, 'recipientName');
    fields.addressLine1 = readString(input, 'addressLine1');
    fields.addressLine2 = readString(input, 'addressLine2');
    fields.city = readString(input, 'city');
    fields.region = readString(input, 'region');
    fields.postcode = readString(input, 'postcode');
    fields.country = readString(input, 'country');
    fields.phone = readString(input, 'phone');
  }
  if (wantsAsanaTrial) {
    fields.workEmail = readString(input, 'workEmail').toLowerCase();
    fields.asanaConsent = input.asanaConsent === true;
  }

  const firstError = Object.values(findSpeakerGiftErrors(fields, EMAIL_PATTERN))[0];
  if (firstError) throw new Error(firstError);
  return fields;
}

function toGift(id: string, data: FirebaseFirestore.DocumentData): SpeakerGift {
  const submittedAt = data.submittedAt as Timestamp | undefined;
  return {
    id,
    speakerName: data.speakerName ?? '',
    speakerEmail: data.speakerEmail ?? '',
    submittedAt: submittedAt ? submittedAt.toDate().toISOString() : new Date().toISOString(),
    wantsMug: data.wantsMug === true,
    recipientName: data.recipientName ?? '',
    addressLine1: data.addressLine1 ?? '',
    addressLine2: data.addressLine2 ?? '',
    city: data.city ?? '',
    region: data.region ?? '',
    postcode: data.postcode ?? '',
    country: data.country ?? '',
    phone: data.phone ?? '',
    wantsAsanaTrial: data.wantsAsanaTrial === true,
    workEmail: data.workEmail ?? '',
    asanaConsent: data.asanaConsent === true,
  };
}

// A speaker's saved answer, to fill the form back in on a second visit. Null if none.
export async function fetchSpeakerGift(speakerId: string): Promise<SpeakerGift | null> {
  const snap = await adminDb.collection('speakerGifts').doc(speakerId).get();
  return snap.exists ? toGift(snap.id, snap.data()!) : null;
}

// For /admin/speaker-gifts.
export async function fetchSpeakerGifts(): Promise<SpeakerGift[]> {
  const snapshot = await adminDb.collection('speakerGifts').orderBy('submittedAt', 'desc').get();
  return snapshot.docs.map((doc) => toGift(doc.id, doc.data()));
}
