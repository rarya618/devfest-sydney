import { createHmac, timingSafeEqual } from 'crypto';

// A speaker confirms from a link in an email, so there is no session to authenticate
// them with. The link carries the submission id plus an HMAC of it, which means the id
// can't be swapped for someone else's without the secret. The token never expires on its
// own: the deadline lives on the submission document, so it can be read and shown rather
// than guessed at from a token that has quietly gone stale.
const TOKEN_SEPARATOR = '.';

// Speakers get this long to confirm before we start offering the slot to someone else.
export const CONFIRM_WINDOW_DAYS = 8;

function signingSecret(): string {
  const secret = process.env.SPEAKER_CONFIRM_SECRET;
  if (!secret) {
    throw new Error('SPEAKER_CONFIRM_SECRET is not set.');
  }
  return secret;
}

function signature(submissionId: string): string {
  return createHmac('sha256', signingSecret()).update(submissionId).digest('base64url');
}

export function createConfirmToken(submissionId: string): string {
  return `${Buffer.from(submissionId).toString('base64url')}${TOKEN_SEPARATOR}${signature(submissionId)}`;
}

// Returns the submission id the token was issued for, or null if the token is malformed
// or wasn't signed with our secret.
export function verifySpeakerConfirmToken(token: string): string | null {
  const [encodedId, providedSignature] = token.split(TOKEN_SEPARATOR);
  if (!encodedId || !providedSignature) return null;

  let submissionId: string;
  try {
    submissionId = Buffer.from(encodedId, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  if (!submissionId) return null;

  let expected: Buffer;
  let provided: Buffer;
  try {
    expected = Buffer.from(signature(submissionId));
    provided = Buffer.from(providedSignature);
  } catch {
    return null;
  }

  // timingSafeEqual throws on a length mismatch, so that case is checked first.
  if (expected.length !== provided.length) return null;
  return timingSafeEqual(expected, provided) ? submissionId : null;
}

export function confirmUrl(submissionId: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://devfest.gdgsydney.com';
  return `${siteUrl.replace(/\/$/, '')}/speaker/confirm?token=${createConfirmToken(submissionId)}`;
}

// The window opens when the acceptance email is sent, not when the proposal was accepted:
// a speaker's week starts the moment they can actually read about it.
export function confirmDeadlineFrom(sentAt: Date): Date {
  const deadline = new Date(sentAt);
  deadline.setDate(deadline.getDate() + CONFIRM_WINDOW_DAYS);
  return deadline;
}
