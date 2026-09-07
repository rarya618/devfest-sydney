import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export interface AdminSession {
  email: string;
  name: string;
}

// Checks the session cookie and the admins collection, and throws if either fails. The
// cookie is verified locally against Google's cached public keys; the previous
// `checkRevoked: true` added a round trip to the Identity Toolkit API (measured at 0.5 to
// 1.2 s from Sydney) on every admin page load and every server action. It is not needed
// as a gate: removing someone from `admins` locks them out on their next request
// regardless, and the cookie itself expires after five days.
//
// Wrapped in `cache` so the dashboard layout and the page it wraps share one lookup per
// request instead of each reading the admins document.
export const verifyAdminSession = cache(async (): Promise<AdminSession> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) throw new Error('No session.');

  const decoded = await adminAuth.verifySessionCookie(sessionCookie);
  if (!decoded.email) throw new Error('No email on session.');

  const adminDoc = await adminDb.collection('admins').doc(decoded.email).get();
  if (!adminDoc.exists) throw new Error('Not an admin.');

  return { email: decoded.email, name: (adminDoc.data()?.name as string | undefined) || decoded.email };
});

// Page-side variant: sends an unauthenticated visitor to the login page.
export async function getVerifiedSession(): Promise<AdminSession> {
  let session: AdminSession;
  try {
    session = await verifyAdminSession();
  } catch {
    redirect('/admin/login');
  }
  return session;
}
