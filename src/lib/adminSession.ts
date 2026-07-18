import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export interface AdminSession {
  email: string;
  name: string;
}

export async function getVerifiedSession(): Promise<AdminSession> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) redirect('/admin/login');

  let email: string | undefined;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    email = decoded.email;
  } catch {
    redirect('/admin/login');
  }
  if (!email) redirect('/admin/login');

  const adminDoc = await adminDb.collection('admins').doc(email).get();
  if (!adminDoc.exists) redirect('/admin/login');

  const name = (adminDoc.data()?.name as string | undefined) || email;

  return { email, name };
}
