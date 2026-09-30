import { createHmac, timingSafeEqual } from 'crypto';

// An entrant confirms from a link in an email, so there is no session to authenticate
// them with. The link carries the entry id plus an HMAC of it, which means the id can't
// be swapped for someone else's without the secret. Same construction as
// volunteerConfirm.ts, and deliberately its own secret for the same reason: rotating one
// shouldn't invalidate the other's links.
const TOKEN_SEPARATOR = '.';

// Entrants get this long to confirm before the slot goes to someone else. Short, like the
// volunteers' window: the running order for the showcase can't be settled until we know
// who is actually demoing, and the event is days away.
export const SHOWCASE_CONFIRM_WINDOW_DAYS = 2;

function signingSecret(): string {
  const secret = process.env.SHOWCASE_CONFIRM_SECRET;
  if (!secret) {
    throw new Error('SHOWCASE_CONFIRM_SECRET is not set.');
  }
  return secret;
}

function signature(entryId: string): string {
  return createHmac('sha256', signingSecret()).update(entryId).digest('base64url');
}

export function createShowcaseConfirmToken(entryId: string): string {
  return `${Buffer.from(entryId).toString('base64url')}${TOKEN_SEPARATOR}${signature(entryId)}`;
}

// Returns the entry id the token was issued for, or null if the token is malformed or
// wasn't signed with our secret.
export function verifyShowcaseConfirmToken(token: string): string | null {
  const [encodedId, providedSignature] = token.split(TOKEN_SEPARATOR);
  if (!encodedId || !providedSignature) return null;

  let entryId: string;
  try {
    entryId = Buffer.from(encodedId, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  if (!entryId) return null;

  let expected: Buffer;
  let provided: Buffer;
  try {
    expected = Buffer.from(signature(entryId));
    provided = Buffer.from(providedSignature);
  } catch {
    return null;
  }

  // timingSafeEqual throws on a length mismatch, so that case is checked first.
  if (expected.length !== provided.length) return null;
  return timingSafeEqual(expected, provided) ? entryId : null;
}

export function showcaseConfirmUrl(entryId: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://devfest.gdgsydney.com';
  return `${siteUrl.replace(/\/$/, '')}/builder-showcase/confirm?token=${createShowcaseConfirmToken(entryId)}`;
}

// The window opens when the acceptance email is sent, not when the entry was accepted:
// an entrant's window starts the moment they can actually read about it.
export function showcaseConfirmDeadlineFrom(sentAt: Date): Date {
  const deadline = new Date(sentAt);
  deadline.setDate(deadline.getDate() + SHOWCASE_CONFIRM_WINDOW_DAYS);
  return deadline;
}
