import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import SubmissionsDashboard from './SubmissionsDashboard';
import type { Submission } from '@/lib/types';
import type { Timestamp } from 'firebase-admin/firestore';

export const metadata = { title: 'Admin — DevFest Sydney 2026' };

async function getVerifiedSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) redirect('/admin/login');
  try {
    await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    redirect('/admin/login');
  }
}

async function fetchSubmissions(): Promise<Submission[]> {
  const snapshot = await adminDb
    .collection('submissions')
    .orderBy('submittedAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const timestamp = data.submittedAt as Timestamp | undefined;
    return {
      id: doc.id,
      name: data.name ?? '',
      email: data.email ?? '',
      talkTitle: data.talkTitle ?? '',
      abstract: data.abstract ?? '',
      format: data.format ?? 'talk',
      track: data.track ?? 'developer',
      experienceLevel: data.experienceLevel ?? 'beginner',
      socialLinks: data.socialLinks ?? '',
      previousTalkLink: data.previousTalkLink ?? '',
      requiresTravelSupport: data.requiresTravelSupport ?? false,
      isGoogleDeveloperExpert: data.isGoogleDeveloperExpert ?? false,
      submittedAt: timestamp ? timestamp.toDate().toISOString() : new Date().toISOString(),
      status: data.status ?? 'pending',
    } satisfies Submission;
  });
}

export default async function AdminPage() {
  await getVerifiedSession();
  const submissions = await fetchSubmissions();

  return <SubmissionsDashboard submissions={submissions} />;
}
