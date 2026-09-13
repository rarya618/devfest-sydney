import { createHmac, timingSafeEqual } from 'crypto';

// A volunteer confirms from a link in an email, so there is no session to authenticate
// them with. The link carries the volunteer id plus an HMAC of it, which means the id
// can't be swapped for someone else's without the secret. Deliberately a separate secret
// from SPEAKER_CONFIRM_SECRET: rotating one shouldn't invalidate the other's links.
const TOKEN_SEPARATOR = '.';

// Volunteers get this long to confirm before we start offering the spot to someone else.
// Shorter than the speakers' window: a volunteer is confirming availability, not
// rearranging a month around preparing a talk.
export const VOLUNTEER_CONFIRM_WINDOW_DAYS = 7;

function signingSecret(): string {
  const secret = process.env.VOLUNTEER_CONFIRM_SECRET;
  if (!secret) {
    throw new Error('VOLUNTEER_CONFIRM_SECRET is not set.');
  }
  return secret;
}

function signature(volunteerId: string): string {
  return createHmac('sha256', signingSecret()).update(volunteerId).digest('base64url');
}

export function createVolunteerConfirmToken(volunteerId: string): string {
  return `${Buffer.from(volunteerId).toString('base64url')}${TOKEN_SEPARATOR}${signature(volunteerId)}`;
}

// Returns the volunteer id the token was issued for, or null if the token is malformed
// or wasn't signed with our secret.
export function verifyVolunteerConfirmToken(token: string): string | null {
  const [encodedId, providedSignature] = token.split(TOKEN_SEPARATOR);
  if (!encodedId || !providedSignature) return null;

  let volunteerId: string;
  try {
    volunteerId = Buffer.from(encodedId, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  if (!volunteerId) return null;

  let expected: Buffer;
  let provided: Buffer;
  try {
    expected = Buffer.from(signature(volunteerId));
    provided = Buffer.from(providedSignature);
  } catch {
    return null;
  }

  // timingSafeEqual throws on a length mismatch, so that case is checked first.
  if (expected.length !== provided.length) return null;
  return timingSafeEqual(expected, provided) ? volunteerId : null;
}

export function volunteerConfirmUrl(volunteerId: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://devfest.gdgsydney.com';
  return `${siteUrl.replace(/\/$/, '')}/volunteer/confirm?token=${createVolunteerConfirmToken(volunteerId)}`;
}

// The window opens when the acceptance email is sent, not when the signup was accepted:
// a volunteer's week starts the moment they can actually read about it.
export function volunteerConfirmDeadlineFrom(sentAt: Date): Date {
  const deadline = new Date(sentAt);
  deadline.setDate(deadline.getDate() + VOLUNTEER_CONFIRM_WINDOW_DAYS);
  return deadline;
}
