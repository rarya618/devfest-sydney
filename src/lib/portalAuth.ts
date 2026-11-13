import { cache } from 'react';
import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Timestamp } from 'firebase-admin/firestore';
import { Resend } from 'resend';
import { adminDb } from '@/lib/firebase-admin';
import { buildPortalSignInEmail, PORTAL_SIGN_IN_SUBJECT } from '@/lib/portalSignInEmail';

// Sign-in for the speaker portal (stage 6 of the plan in PM.md). Speakers sign in with a
// single-use link emailed to them, not with Google and not with Firebase Auth's email link:
//
// - The link is used behind a button (/speaker/sign-in/verify), never on page load, so a mail
//   scanner that opens it signs no one in and doesn't burn the link. Firebase's email link
//   signs in from page-load JavaScript, which is the problem every confirm page here avoids.
// - It is sent through Resend from hello@gdgsydney.com, like every other email the app sends,
//   and needs no custom Auth domain.
// - The portal's session is its own cookie, never the admin's `__session`, so being signed in
//   as a speaker can't reach anything under /admin.
//
// Signing in proves only that you can read mail at an address. Everything the portal shows is
// what that address owns: the `speakers` people with that email, and the proposals filed
// under it. An address with neither can still sign in, to propose a first talk.
//
// Only hashes of the link and session tokens are stored, so reading these collections (or a
// backup of them) yields nothing that signs anyone in. All three collections are Admin SDK
// only, with no match block in firestore.rules.

const SIGN_IN_LINKS = 'portalSignInLinks';
const SIGN_IN_REQUESTS = 'portalSignInRequests';
const SESSIONS = 'portalSessions';

export const PORTAL_SESSION_COOKIE = 'portal_session';
const SIGN_IN_LINK_MINUTES = 30;
const SESSION_DAYS = 30;

// Per address, so the form can't be used to flood someone's inbox.
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_LINKS_PER_HOUR = 5;

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function newToken(): string {
  return randomBytes(32).toString('base64url');
}

export function normalisePortalEmail(email: string): string {
  return email.trim().toLowerCase();
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://app.gdgsydney.com').replace(/\/$/, '');
}

export type SignInLinkRequest = { status: 'sent' } | { status: 'rate-limited'; retryAfterSeconds: number };

// Emails a sign-in link to any well-formed address (the caller validates it). The answer is
// the same whether or not we know the address, so the form can't be used to find out who has
// spoken for us. Throws when the link can't be stored or the email can't be sent.
export async function requestSignInLink(email: string): Promise<SignInLinkRequest> {
  const emailNormalised = normalisePortalEmail(email);
  const now = Date.now();

  // Keyed by a hash of the address, so this bookkeeping holds no email addresses.
  const requestRef = adminDb.collection(SIGN_IN_REQUESTS).doc(sha256(emailNormalised));
  const rateLimit = await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(requestRef);
    const recentSends = ((snapshot.data()?.sentAtMillis ?? []) as number[]).filter((sentAt) => now - sentAt < 60 * 60 * 1000);
    const lastSend = recentSends.length ? Math.max(...recentSends) : 0;
    if (now - lastSend < RESEND_COOLDOWN_SECONDS * 1000) {
      return { retryAfterSeconds: Math.ceil((RESEND_COOLDOWN_SECONDS * 1000 - (now - lastSend)) / 1000) };
    }
    if (recentSends.length >= MAX_LINKS_PER_HOUR) {
      const oldest = Math.min(...recentSends);
      return { retryAfterSeconds: Math.ceil((60 * 60 * 1000 - (now - oldest)) / 1000) };
    }
    transaction.set(requestRef, {
      sentAtMillis: [...recentSends, now],
      // For a Firestore TTL policy on this collection: the entry is useless an hour later.
      expiresAt: Timestamp.fromMillis(now + 60 * 60 * 1000),
    });
    return null;
  });
  if (rateLimit) return { status: 'rate-limited', retryAfterSeconds: rateLimit.retryAfterSeconds };

  const token = newToken();
  await adminDb.collection(SIGN_IN_LINKS).doc(sha256(token)).set({
    emailNormalised,
    createdAt: Timestamp.fromMillis(now),
    expiresAt: Timestamp.fromMillis(now + SIGN_IN_LINK_MINUTES * 60 * 1000),
  });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: `GDG Sydney <${process.env.RESEND_FROM_EMAIL}>`,
    to: emailNormalised,
    replyTo: 'hello@gdgsydney.com',
    subject: PORTAL_SIGN_IN_SUBJECT,
    html: buildPortalSignInEmail({
      email: emailNormalised,
      signInUrl: `${siteUrl()}/speaker/sign-in/verify?token=${token}`,
      validForMinutes: SIGN_IN_LINK_MINUTES,
    }),
  });
  if (error) throw new Error(`Resend refused the sign-in email: ${error.message}`);
  return { status: 'sent' };
}

function isExpired(expiresAt: unknown): boolean {
  return !(expiresAt instanceof Timestamp) || expiresAt.toMillis() <= Date.now();
}

// For the verify page: which address a link is for, without using it up. Null when the link
// is unknown, already used or out of date.
export async function peekSignInLink(token: string): Promise<string | null> {
  if (!token) return null;
  const snapshot = await adminDb.collection(SIGN_IN_LINKS).doc(sha256(token)).get();
  const link = snapshot.data();
  if (!link || isExpired(link.expiresAt)) return null;
  return String(link.emailNormalised ?? '') || null;
}

// Uses a link up (it is deleted in the same transaction it is read in, so two clicks can't
// both sign in) and starts a session for its address. Null when the link is no good.
export async function signInWithLink(token: string): Promise<string | null> {
  if (!token) return null;
  const linkRef = adminDb.collection(SIGN_IN_LINKS).doc(sha256(token));
  const emailNormalised = await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(linkRef);
    const link = snapshot.data();
    if (!link) return null;
    transaction.delete(linkRef);
    if (isExpired(link.expiresAt)) return null;
    return String(link.emailNormalised ?? '') || null;
  });
  if (!emailNormalised) return null;

  const sessionToken = newToken();
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  await adminDb.collection(SESSIONS).doc(sha256(sessionToken)).set({
    emailNormalised,
    createdAt: Timestamp.now(),
    expiresAt: Timestamp.fromMillis(expiresAt),
  });

  const cookieStore = await cookies();
  cookieStore.set(PORTAL_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    // Sent under /speaker only (the portal, plus /speaker/confirm and /speaker/thanks, which
    // ignore it), never to /admin or the API.
    path: '/speaker',
    expires: new Date(expiresAt),
  });
  return emailNormalised;
}

export interface PortalSession {
  email: string; // normalised
}

// The signed-in address, or null. Once per request. Throws on a failed read, so a page can
// tell "not signed in" apart from "couldn't check".
export const getPortalSession = cache(async (): Promise<PortalSession | null> => {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
  if (!sessionToken) return null;
  const snapshot = await adminDb.collection(SESSIONS).doc(sha256(sessionToken)).get();
  const session = snapshot.data();
  if (!session || isExpired(session.expiresAt)) return null;
  const email = String(session.emailNormalised ?? '');
  return email ? { email } : null;
});

// Page-side: sends a visitor who isn't signed in to the sign-in page.
export async function requirePortalSession(): Promise<PortalSession> {
  const session = await getPortalSession();
  if (!session) redirect('/speaker/sign-in');
  return session;
}

// Ends this browser's session (the others an address has stay signed in).
export async function endPortalSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
  if (sessionToken) await adminDb.collection(SESSIONS).doc(sha256(sessionToken)).delete();
  cookieStore.delete({ name: PORTAL_SESSION_COOKIE, path: '/speaker' });
}
